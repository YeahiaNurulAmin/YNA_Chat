import { useEffect, useRef } from "react";

function getAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  return AudioCtx ? new AudioCtx() : null;
}

function playDualTone(context, frequencies, startTime, duration, volume = 0.05) {
  for (const frequency of frequencies) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }
}

/** Classic incoming-call pattern: two short bursts, then pause. */
function scheduleIncomingRing(context, startAt) {
  const burstDuration = 0.45;
  const gap = 0.2;
  const cycleLength = 3;

  playDualTone(context, [440, 480], startAt, burstDuration);
  playDualTone(context, [440, 480], startAt + burstDuration + gap, burstDuration);

  return startAt + cycleLength;
}

/** Outgoing ringback: sustained tone, then long pause (what callers expect while waiting). */
function scheduleOutgoingRingback(context, startAt) {
  const toneDuration = 1.8;
  const cycleLength = 4.5;

  playDualTone(context, [440, 480], startAt, toneDuration, 0.04);

  return startAt + cycleLength;
}

function useCallSoundLoop(isActive, scheduleCycle) {
  const contextRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (contextRef.current) {
        void contextRef.current.close();
        contextRef.current = null;
      }
      return undefined;
    }

    const context = getAudioContext();
    if (!context) return undefined;
    contextRef.current = context;
    void context.resume();

    let cancelled = false;
    let nextStart = context.currentTime + 0.05;

    const runCycle = () => {
      if (cancelled) return;
      nextStart = Math.max(nextStart, context.currentTime + 0.02);
      nextStart = scheduleCycle(context, nextStart);
      const delayMs = Math.max(50, (nextStart - context.currentTime) * 1000);
      timeoutRef.current = window.setTimeout(runCycle, delayMs);
    };

    runCycle();

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      void context.close();
      contextRef.current = null;
    };
  }, [isActive, scheduleCycle]);
}

export function useIncomingRingtone(isActive) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio("/sounds/incoming-ringtone.mp3");
    audio.loop = true;
    audio.volume = 0.7;
    audioRef.current = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Incoming ringtone autoplay prevented or failed:", err);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [isActive]);
}

export function useOutgoingRingback(isActive) {
  useCallSoundLoop(isActive, scheduleOutgoingRingback);
}

