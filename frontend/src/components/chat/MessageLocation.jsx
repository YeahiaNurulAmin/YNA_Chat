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
        <div className="relative overflow-hidden rounded-xl border border-black/10 bg-black/5">
          {mapPreviewFailed ? (
            <div className="flex h-28 items-center justify-center bg-linear-to-br from-sky-100 to-emerald-100 sm:h-32">
              <MapPinIcon className="size-10 text-red-500" strokeWidth={1.75} aria-hidden />
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
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-red-600 drop-shadow"
            aria-hidden
          >
            <MapPinIcon className="size-7 fill-red-600 text-red-700" strokeWidth={1.5} />
          </span>
          {isLiveLocation ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              Live
            </span>
          ) : null}
        </div>
      </a>

      <div className="mt-2 flex items-start gap-2">
        <MapPinIcon
          className={`mt-0.5 size-4 shrink-0 ${isOwnMessage ? "text-accent-foreground/80" : "text-accent"}`}
          strokeWidth={2}
        />
        <div className="min-w-0">
          <p
            className={`text-sm font-medium ${isOwnMessage ? "text-accent-foreground" : "text-foreground"}`}
          >
            {formatCoordinates(location.latitude, location.longitude)}
          </p>
          {location.accuracy != null ? (
            <p
              className={`text-xs ${isOwnMessage ? "text-accent-foreground/75" : "text-muted"}`}
            >
              ±{Math.round(location.accuracy)} m accuracy
            </p>
          ) : null}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 inline-block text-xs font-medium underline-offset-2 hover:underline ${
              isOwnMessage ? "text-accent-foreground/90" : "text-accent"
            }`}
          >
            Open in maps
          </a>
          <p
            className={`mt-1 text-[11px] tabular-nums ${
              isOwnMessage ? "text-accent-foreground/75" : "text-muted"
            }`}
          >
            {capturedTime}
          </p>
        </div>
      </div>
    </div>
  );
}
