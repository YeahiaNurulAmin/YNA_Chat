export const LOCATION_LIMITS = {
  MIN_INTERVAL_MS: 1000,
  MAX_INTERVAL_MS: 24 * 60 * 60 * 1000,
  MIN_PING_INTERVAL_MS: 2000,
  DEDUPE_METERS: 5,
};

export function parseLocation(raw) {
  if (!raw) return { location: null };

  let location = raw;
  if (typeof raw === "string") {
    try {
      location = JSON.parse(raw);
    } catch {
      return { error: "Invalid location payload" };
    }
  }

  if (typeof location !== "object" || location === null || Array.isArray(location)) {
    return { error: "Invalid location payload" };
  }

  const { latitude, longitude, accuracy, capturedAt } = location;

  if (
    latitude === undefined ||
    latitude === null ||
    longitude === undefined ||
    longitude === null
  ) {
    return { error: "Location requires latitude and longitude" };
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { error: "Invalid location coordinates" };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: "Location coordinates out of range" };
  }

  const parsed = { latitude: lat, longitude: lng };

  if (accuracy !== undefined && accuracy !== null && accuracy !== "") {
    const acc = Number(accuracy);
    if (!Number.isNaN(acc) && acc >= 0) parsed.accuracy = acc;
  }

  if (capturedAt) {
    const date = new Date(capturedAt);
    if (!Number.isNaN(date.getTime())) parsed.capturedAt = date;
  } else {
    parsed.capturedAt = new Date();
  }

  return { location: parsed };
}

export function parseIntervalMs(raw) {
  const ms = Number(raw);
  if (!Number.isFinite(ms) || ms < LOCATION_LIMITS.MIN_INTERVAL_MS) {
    return { error: `Minimum interval is ${LOCATION_LIMITS.MIN_INTERVAL_MS / 1000} second(s)` };
  }
  if (ms > LOCATION_LIMITS.MAX_INTERVAL_MS) {
    return { error: "Maximum interval is 24 hours" };
  }
  return { intervalMs: Math.round(ms) };
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
