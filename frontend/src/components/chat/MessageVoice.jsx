import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "lucide-react";

let activeVoiceAudio = null;

const WAVE_BARS = [3, 5, 8, 6, 9, 7, 4, 8, 5, 7, 6, 9, 4, 8, 5];

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
    <div className={`msg-voice ${isOwnMessage ? "msg-voice--own" : "msg-voice--peer"}`}>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        className="msg-voice__play"
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        onClick={() => void togglePlayback()}
      >
        {isPlaying ? (
          <PauseIcon className="size-4" strokeWidth={2} />
        ) : (
          <PlayIcon className="size-4" strokeWidth={2} />
        )}
      </button>

      <div className="msg-voice__body">
        <div className="msg-voice__wave" aria-hidden>
          {WAVE_BARS.map((height, index) => {
            const barProgress = (index / WAVE_BARS.length) * 100;
            const isActive = barProgress <= progress;
            return (
              <span
                key={index}
                className={`msg-voice__bar ${isActive ? "msg-voice__bar--active" : ""}`}
                style={{ height: `${height * 2}px` }}
              />
            );
          })}
        </div>
        <span className="caption-tabular">{formatDuration(timeLabel)}</span>
      </div>
    </div>
  );
}
