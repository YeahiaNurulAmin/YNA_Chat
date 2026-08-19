import { useState } from "react";
import { Crosshair, MapPin, X } from "lucide-react";
import type { LocationPin } from "../../../api/types";

const MONO = "'JetBrains Mono', monospace";
const CYAN = "#22d3ee";
const MAGENTA = "#f0f";
const VIOLET = "#8b5cf6";

// Static, stylized map picker (no external map lib) — click the grid to drop a
// pin, or use the browser Geolocation API to auto-locate.
export function CyberLocationModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (pin: LocationPin) => void;
}) {
  const [pin, setPin] = useState<LocationPin>({ lat: 40.7128, lng: -74.006, label: "Financial District, New York, NY" });
  const [marker, setMarker] = useState({ x: 50, y: 50 }); // percent
  const [locating, setLocating] = useState(false);

  const dropPin = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMarker({ x, y });
    // Map percentage to plausible coordinates for the demo.
    const lat = +(90 - (y / 100) * 180).toFixed(4);
    const lng = +((x / 100) * 360 - 180).toFixed(4);
    setPin({ lat, lng, label: `Dropped pin · ${lat}, ${lng}` });
  };

  const useMyLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = +pos.coords.latitude.toFixed(4);
        const lng = +pos.coords.longitude.toFixed(4);
        setPin({ lat, lng, label: `My location · ${lat}, ${lng}` });
        setMarker({ x: ((lng + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <CyberModalShell title="DROP LOCATION" onClose={onClose}>
      <div
        onClick={dropPin}
        className="relative w-full h-64 rounded-lg overflow-hidden cursor-crosshair"
        style={{
          background: "#04040a",
          border: `1px solid ${CYAN}55`,
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        {/* glow rings */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 120%, rgba(139,92,246,0.25), transparent 60%)" }} />
        <div
          className="absolute"
          style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: "translate(-50%,-100%)" }}
        >
          <MapPin size={30} style={{ color: MAGENTA, filter: `drop-shadow(0 0 8px ${MAGENTA})` }} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: "rgba(34,211,238,0.06)", border: `1px solid ${CYAN}44` }}>
        <MapPin size={14} style={{ color: CYAN }} />
        <span className="truncate" style={{ fontFamily: MONO, fontSize: 12, color: "#cbd5e1" }}>{pin.label}</span>
      </div>

      <button
        onClick={useMyLocation}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-md"
        style={{ border: `1px solid ${VIOLET}`, color: VIOLET, fontFamily: MONO, fontSize: 12, background: "rgba(139,92,246,0.08)" }}
      >
        <Crosshair size={15} />
        {locating ? "LOCATING…" : "USE MY CURRENT LOCATION"}
      </button>

      <button
        onClick={() => onConfirm(pin)}
        className="mt-3 w-full py-3 rounded-md"
        style={{
          background: `linear-gradient(135deg, ${CYAN}, ${MAGENTA})`,
          color: "#04040a",
          fontFamily: MONO,
          fontWeight: 700,
          boxShadow: `0 0 18px ${CYAN}66`,
        }}
      >
        CONFIRM &amp; SEND LOCATION
      </button>
    </CyberModalShell>
  );
}

export function CyberModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" style={{ background: "rgba(2,2,8,0.75)", backdropFilter: "blur(6px)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-[1.5px]"
        style={{ background: `linear-gradient(120deg, ${CYAN}, ${VIOLET}, ${MAGENTA})`, boxShadow: `0 0 40px rgba(34,211,238,0.3)` }}
      >
        <div className="rounded-2xl p-5" style={{ background: "#06060f" }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontFamily: MONO, letterSpacing: "0.15em", color: CYAN }}>{title}</span>
            <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-md" style={{ border: `1px solid ${MAGENTA}55`, color: MAGENTA }}>
              <X size={16} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
