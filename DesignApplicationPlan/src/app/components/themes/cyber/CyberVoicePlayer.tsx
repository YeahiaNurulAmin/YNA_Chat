import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

// Waveform bar heights (static pseudo-random pattern).
const BARS = [8, 14, 20, 12, 24, 16, 28, 10, 18, 26, 14, 22, 9, 17, 25, 13, 21, 11, 19, 15];

export function CyberVoicePlayer({ durationSec = 8, color }: { durationSec?: number; color: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const raf = useRef<number | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!playing) {
      if (raf.current) cancelAnimationFrame(raf.current);
      return;
    }
    startedAt.current = performance.now() - progress * durationSec * 1000;
    const tick = () => {
      const elapsed = (performance.now() - startedAt.current) / 1000;
      const p = Math.min(elapsed / durationSec, 1);
      setProgress(p);
      if (p >= 1) {
        setPlaying(false);
        setProgress(0);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const remaining = Math.ceil(durationSec * (1 - progress));
  const label = `${String(Math.floor(remaining / 60)).padStart(1, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 py-1" style={{ minWidth: 180 }}>
      <button
        onClick={() => setPlaying((p) => !p)}
        className="w-9 h-9 rounded-full grid place-items-center shrink-0"
        style={{ border: `1px solid ${color}`, color, background: `${color}18` }}
      >
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <div className="flex items-center gap-[3px] flex-1 h-8">
        {BARS.map((h, i) => {
          const filled = i / BARS.length <= progress;
          return (
            <span
              key={i}
              style={{
                width: 3,
                height: h,
                borderRadius: 2,
                background: filled ? color : `${color}44`,
                boxShadow: filled ? `0 0 6px ${color}` : "none",
              }}
            />
          );
        })}
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color }}>{label}</span>
    </div>
  );
}
