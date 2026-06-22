import { useCallback, useEffect, useRef, useState } from "react";

const MAX_RECORDING_SECONDS = 5 * 60;
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return null;

  for (const mimeType of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mimeType)) return mimeType;
  }

  return "";
}

function getExtensionForMimeType(mimeType) {
  if (mimeType.includes("mp4")) return "m4a";
  return "webm";
}

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSupported] = useState(() => {
    return (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined"
    );
  });

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef("");
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);
  const maxDurationReachedRef = useRef(false);
  const onMaxDurationRef = useRef(null);

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    mediaRecorderRef.current = null;
    chunksRef.current = [];
    stopStream(mediaStreamRef.current);
    mediaStreamRef.current = null;
    setIsRecording(false);
    setElapsedSeconds(0);
    cancelledRef.current = false;
    maxDurationReachedRef.current = false;
  }, []);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => cleanupRecording();
      recorder.stop();
      return;
    }

    cleanupRecording();
  }, [cleanupRecording]);

  const startRecording = useCallback(async () => {
    if (!isSupported || isRecording) return false;

    const mimeType = getSupportedMimeType();
    if (mimeType === null) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      mimeTypeRef.current = mimeType;
      cancelledRef.current = false;
      maxDurationReachedRef.current = false;

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.start(250);
      startTimeRef.current = performance.now();
      setElapsedSeconds(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        const seconds = Math.floor((performance.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(seconds);

        if (seconds >= MAX_RECORDING_SECONDS && !maxDurationReachedRef.current) {
          maxDurationReachedRef.current = true;
          onMaxDurationRef.current?.();
        }
      }, 200);

      return true;
    } catch {
      cleanupRecording();
      return false;
    }
  }, [cleanupRecording, isRecording, isSupported]);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === "inactive") {
        cleanupRecording();
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const wasCancelled = cancelledRef.current;
        const durationSeconds = Math.round((performance.now() - startTimeRef.current) / 1000);

        if (wasCancelled || chunksRef.current.length === 0) {
          cleanupRecording();
          resolve(null);
          return;
        }

        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || "audio/webm",
        });
        const extension = getExtensionForMimeType(mimeTypeRef.current);

        cleanupRecording();
        resolve({
          blob,
          durationSeconds,
          extension,
        });
      };

      recorder.stop();
    });
  }, [cleanupRecording]);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = () => cleanupRecording();
        recorder.stop();
      } else {
        cleanupRecording();
      }
    };
  }, [cleanupRecording]);

  return {
    isSupported,
    isRecording,
    elapsedSeconds,
    startRecording,
    stopRecording,
    cancelRecording,
    setOnMaxDuration: (callback) => {
      onMaxDurationRef.current = callback;
    },
  };
}
