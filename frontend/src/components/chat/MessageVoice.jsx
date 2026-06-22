import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { PauseIcon, PlayIcon } from "lucide-react";

let activeVoiceAudio = null;

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function MessageVoice({ src, isOwnMessage = false }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (activeVoiceAudio === audio) activeVoiceAudio = null;
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (activeVoiceAudio === audio) activeVoiceAudio = null;
      return;
    }

    if (activeVoiceAudio && activeVoiceAudio !== audio) {
      activeVoiceAudio.pause();
      activeVoiceAudio.currentTime = 0;
    }

    try {
      await audio.play();
      activeVoiceAudio = audio;
      setIsPlaying(true);
    } catch (error) {
      console.error("Voice playback failed:", error);
    }
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const timeLabel = isPlaying || currentTime > 0 ? currentTime : duration;

  return (
    <div className="mb-1.5 flex min-w-48 max-w-full items-center gap-2 sm:min-w-56">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <Button
        variant="ghost"
        isIconOnly
        size="sm"
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        className={`size-8 min-w-8 shrink-0 rounded-full ${
          isOwnMessage
            ? "bg-accent-foreground/15 text-accent-foreground"
            : "bg-accent/10 text-accent"
        }`}
        onPress={togglePlayback}
      >
        {isPlaying ? (
          <PauseIcon className="size-4" strokeWidth={2} />
        ) : (
          <PlayIcon className="size-4" strokeWidth={2} />
        )}
      </Button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          className={`h-1.5 overflow-hidden rounded-full ${
            isOwnMessage ? "bg-accent-foreground/20" : "bg-border"
          }`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-150 ${
              isOwnMessage ? "bg-accent-foreground" : "bg-accent"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span
          className={`text-[11px] tabular-nums ${
            isOwnMessage ? "text-accent-foreground/75" : "text-muted"
          }`}
        >
          {formatDuration(timeLabel)}
        </span>
      </div>
    </div>
  );
}
