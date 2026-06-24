import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getCurrentLocation, getCurrentLocationWithRetry } from "../lib/location";
import { useChatStore } from "../store/useChatStore";

const MAX_CONSECUTIVE_FAILURES = 3;

export function useEmergencyLocationSession(activeConversationId) {
  const startLiveLocationSession = useChatStore((state) => state.startLiveLocationSession);
  const pingLiveLocationSession = useChatStore((state) => state.pingLiveLocationSession);
  const stopLiveLocationSession = useChatStore((state) => state.stopLiveLocationSession);
  const emergencyLocationSession = useChatStore((state) => state.emergencyLocationSession);

  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [intervalMs, setIntervalMs] = useState(null);
  const [lastSentAt, setLastSentAt] = useState(null);
  const [lastPosition, setLastPosition] = useState(null);
  const [sendCount, setSendCount] = useState(0);
  const [error, setError] = useState(null);
  const [startedAt, setStartedAt] = useState(null);

  const watchIdRef = useRef(null);
  const intervalIdRef = useRef(null);
  const wakeLockRef = useRef(null);
  const latestCoordsRef = useRef(null);
  const consecutiveFailuresRef = useRef(0);
  const conversationIdRef = useRef(activeConversationId);
  const isActiveRef = useRef(false);
  const sessionIdRef = useRef(null);
  const stopRef = useRef(null);

  useEffect(() => {
    conversationIdRef.current = activeConversationId;
    isActiveRef.current = isActive;
    sessionIdRef.current = sessionId;
  }, [activeConversationId, isActive, sessionId]);

  useEffect(() => {
    if (!emergencyLocationSession) return;
    setIsActive(true);
    setSessionId(emergencyLocationSession.sessionId);
    setIntervalMs(emergencyLocationSession.intervalMs);
    setStartedAt(emergencyLocationSession.startedAt);
    sessionIdRef.current = emergencyLocationSession.sessionId;
    isActiveRef.current = true;
  }, [emergencyLocationSession]);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const clearIntervalTimer = useCallback(() => {
    if (intervalIdRef.current != null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release();
    } catch {
      // Wake lock may already be released.
    } finally {
      wakeLockRef.current = null;
    }
  }, []);

  const resetSessionState = useCallback(() => {
    setIsActive(false);
    setSessionId(null);
    setIntervalMs(null);
    setLastSentAt(null);
    setLastPosition(null);
    setSendCount(0);
    setError(null);
    setStartedAt(null);
    latestCoordsRef.current = null;
    consecutiveFailuresRef.current = 0;
    sessionIdRef.current = null;
    isActiveRef.current = false;
  }, []);

  const stop = useCallback(
    async ({ sendEndMessage = true } = {}) => {
      const currentSessionId = sessionIdRef.current;
      if (!currentSessionId) return;

      clearIntervalTimer();
      clearWatch();
      await releaseWakeLock();

      resetSessionState();

      await stopLiveLocationSession({
        sessionId: currentSessionId,
        sendEndMessage,
      });
    },
    [clearIntervalTimer, clearWatch, releaseWakeLock, resetSessionState, stopLiveLocationSession],
  );

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const sendPing = useCallback(
    async ({ force = false } = {}) => {
      const currentSessionId = sessionIdRef.current;
      if (!currentSessionId) return;

      let coords = latestCoordsRef.current;
      if (!coords) {
        try {
          coords = await getCurrentLocationWithRetry();
          latestCoordsRef.current = coords;
        } catch (locationError) {
          consecutiveFailuresRef.current += 1;
          setError(locationError.message);
          if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
            toast.error("Live location stopped after repeated failures");
            await stop({ sendEndMessage: false });
          }
          return;
        }
      }

      const result = await pingLiveLocationSession({
        sessionId: currentSessionId,
        location: coords,
        force,
      });

      if (!result) return;

      if (result.skipped) return;

      consecutiveFailuresRef.current = 0;
      setError(null);
      setLastPosition(coords);
      setLastSentAt(Date.now());
      setSendCount((count) => count + 1);
    },
    [pingLiveLocationSession, stop],
  );

  const start = useCallback(
    async ({ conversationId, intervalMs: chosenIntervalMs }) => {
      if (!conversationId) return false;
      if (isActiveRef.current) {
        toast.error("Live location is already active");
        return false;
      }

      try {
        const initialCoords = await getCurrentLocation();
        latestCoordsRef.current = initialCoords;
      } catch {
        return false;
      }

      const session = await startLiveLocationSession({
        receiverId: conversationId,
        intervalMs: chosenIntervalMs,
      });

      if (!session) return false;

      const startedAtMs = new Date(session.startedAt).getTime();

      setIsActive(true);
      setSessionId(session.sessionId);
      setIntervalMs(session.intervalMs);
      setStartedAt(startedAtMs);
      setSendCount(0);
      setLastPosition(null);
      setError(null);
      sessionIdRef.current = session.sessionId;
      isActiveRef.current = true;

      if ("wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        } catch {
          // Wake lock is best-effort only.
        }
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          latestCoordsRef.current = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            capturedAt: new Date().toISOString(),
          };
        },
        () => {
          // Errors are handled on the interval send path.
        },
        { enableHighAccuracy: true, maximumAge: 5000 },
      );

      await sendPing({ force: true });

      intervalIdRef.current = setInterval(() => {
        void sendPing();
      }, session.intervalMs);

      return true;
    },
    [sendPing, startLiveLocationSession],
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isActiveRef.current) return;
      if (!document.hidden) {
        void sendPing({ force: true });
      }
    };

    const handlePageHide = () => {
      void stop({ sendEndMessage: false });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [sendPing, stop]);

  useEffect(() => {
    if (
      isActive &&
      emergencyLocationSession?.conversationId &&
      activeConversationId &&
      String(emergencyLocationSession.conversationId) !== String(activeConversationId)
    ) {
      void stop({ sendEndMessage: false });
    }
  }, [activeConversationId, emergencyLocationSession, isActive, stop]);

  useEffect(() => {
    return () => {
      void stopRef.current({ sendEndMessage: false });
    };
  }, []);

  return {
    isActive,
    sessionId,
    intervalMs,
    lastSentAt,
    lastPosition,
    sendCount,
    error,
    startedAt,
    start,
    stop,
  };
}
