import toast from "react-hot-toast";
import { getCachedLocationConfig } from "./locationApi";

export const FREQUENCY_PRESETS = [
  { label: "1s", ms: 1000 },
  { label: "5s", ms: 5000 },
  { label: "15s", ms: 15000 },
  { label: "30s", ms: 30000 },
  { label: "1 min", ms: 60_000 },
  { label: "5 min", ms: 300_000 },
  { label: "15 min", ms: 900_000 },
  { label: "1 hr", ms: 3_600_000 },
];

const MIN_FREQUENCY_MS = 1000;
const MAX_FREQUENCY_MS = 24 * 60 * 60 * 1000;

const GEOLOCATION_ERRORS = {
  1: "Location permission denied. Enable location access in your browser settings.",
  2: "Location unavailable. Check that GPS or location services are enabled.",
  3: "Location request timed out. Try again.",
};

export function isGeolocationSupported() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function isSecureContext() {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function formatCoordinates(latitude, longitude, precision = 5) {
  return `${Number(latitude).toFixed(precision)}, ${Number(longitude).toFixed(precision)}`;
}

export function getMapUrl(latitude, longitude, zoom = 16) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const config = getCachedLocationConfig();

  if (config?.mapProvider === "openstreetmap") {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
  }

  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}

function latLonToTile(latitude, longitude, zoom) {
  const scale = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * scale);
  const latRad = (latitude * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale,
  );
  return { x, y, zoom };
}

/** OSM tile preview — prefer backend provider config when loaded. */
export function getStaticMapImageUrl(latitude, longitude, zoom = 15) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const { x, y } = latLonToTile(lat, lng, zoom);
  const config = getCachedLocationConfig();
  const tileUrl = config?.tileLayer?.url;

  if (tileUrl && tileUrl.includes("{z}")) {
    return tileUrl.replace("{s}.", "").replace("{z}", zoom).replace("{x}", x).replace("{y}", y);
  }

  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export function parseFrequencyInput(value, unit) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return { ok: false, message: "Enter a positive number" };
  }

  const multipliers = { seconds: 1000, minutes: 60_000, hours: 3_600_000 };
  const multiplier = multipliers[unit];
  if (!multiplier) {
    return { ok: false, message: "Invalid time unit" };
  }

  const ms = Math.round(numericValue * multiplier);
  if (ms < MIN_FREQUENCY_MS) {
    return { ok: false, message: "Minimum interval is 1 second" };
  }
  if (ms > MAX_FREQUENCY_MS) {
    return { ok: false, message: "Maximum interval is 24 hours" };
  }

  return { ok: true, ms };
}

export function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapGeolocationError(error) {
  if (!isSecureContext()) {
    return "Location requires a secure connection (HTTPS).";
  }
  return GEOLOCATION_ERRORS[error?.code] || "Could not get your location.";
}

export function getGeolocationErrorMessage(error) {
  if (!error) return "Could not get your location.";
  if (error.code !== undefined) return mapGeolocationError(error);
  if (typeof error.message === "string" && error.message.length > 0) return error.message;
  return "Could not get your location.";
}

export function getCurrentLocation({ enableHighAccuracy = true, timeout = 15000, silent = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      const message = "Geolocation is not supported in this browser.";
      if (!silent) toast.error(message);
      reject(new Error(message));
      return;
    }

    if (!isSecureContext()) {
      const message = "Location requires a secure connection (HTTPS).";
      if (!silent) toast.error(message);
      reject(new Error(message));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
      },
      (error) => {
        const message = mapGeolocationError(error);
        if (!silent) toast.error(message);
        reject(new Error(message));
      },
      { enableHighAccuracy, timeout, maximumAge: 0 },
    );
  });
}

export async function getCurrentLocationWithRetry(options = {}) {
  try {
    return await getCurrentLocation(options);
  } catch (firstError) {
    try {
      return await getCurrentLocation({ ...options, timeout: (options.timeout ?? 15000) + 5000 });
    } catch {
      throw firstError;
    }
  }
}
