import { MapPinIcon } from "lucide-react";
import { useState } from "react";
import { formatCoordinates, getMapUrl, getStaticMapImageUrl } from "../../lib/location";

function formatCapturedTime(capturedAt, fallbackTime) {
  if (!capturedAt) return fallbackTime;
  return new Date(capturedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessageLocation({ location, isLiveLocation = false, time, isOwnMessage = false }) {
  const [mapPreviewFailed, setMapPreviewFailed] = useState(false);

  if (!location?.latitude || !location?.longitude) return null;

  const mapUrl = getMapUrl(location.latitude, location.longitude);
  const staticMapUrl = getStaticMapImageUrl(location.latitude, location.longitude);
  const capturedTime = formatCapturedTime(location.capturedAt, time);

  return (
    <div className="mb-1.5 overflow-hidden rounded-xl">
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        aria-label="Open location in maps"
      >
        <div className="relative overflow-hidden rounded-lg border border-[var(--cl-border-muted)] bg-[var(--cl-bg-mesh)]">
          {mapPreviewFailed ? (
            <div className="cyber-map-fallback sm:h-32">
              <MapPinIcon className="size-10 text-[var(--cl-glow-magenta)]" strokeWidth={1.75} aria-hidden />
            </div>
          ) : (
            <img
              src={staticMapUrl}
              alt=""
              className="h-28 w-full object-cover transition-opacity group-hover:opacity-90 sm:h-32"
              loading="lazy"
              onError={() => setMapPreviewFailed(true)}
            />
          )}
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-[var(--cl-glow-magenta)] drop-shadow-[0_0_6px_rgba(255,0,255,0.55)]"
            aria-hidden
          >
            <MapPinIcon className="size-7 fill-[var(--cl-glow-magenta)] text-[var(--cl-glow-magenta)]" strokeWidth={1.5} />
          </span>
          {isLiveLocation ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[var(--cl-status-alert)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-[0_0_10px_rgba(239,68,68,0.45)]">
              <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              Live
            </span>
          ) : null}
        </div>
      </a>

      <div className="mt-2 flex items-start gap-2">
        <MapPinIcon
          className={`mt-0.5 size-4 shrink-0 ${isOwnMessage ? "text-[var(--cl-glow-magenta)]" : "text-[var(--cl-glow-cyan)]"}`}
          strokeWidth={2}
        />
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium text-[var(--cl-on-surface)]">
            {formatCoordinates(location.latitude, location.longitude)}
          </p>
          {location.accuracy != null ? (
            <p className="text-xs text-[var(--cl-outline)]">
              ±{Math.round(location.accuracy)} m accuracy
            </p>
          ) : null}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 inline-block text-xs font-medium underline-offset-2 hover:underline ${
              isOwnMessage ? "text-[var(--cl-glow-magenta)]" : "text-[var(--cl-glow-cyan)]"
            }`}
          >
            Open in maps
          </a>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-[var(--cl-outline)]">
            {capturedTime}
          </p>
        </div>
      </div>
    </div>
  );
}
