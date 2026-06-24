import { axiosInstance } from "./axios";

let cachedConfig = null;

export async function fetchLocationConfig({ force = false } = {}) {
  if (cachedConfig && !force) return cachedConfig;

  const res = await axiosInstance.get("/location/config");
  cachedConfig = res.data;
  return cachedConfig;
}

export function getCachedLocationConfig() {
  return cachedConfig;
}

export async function sendStaticLocation(receiverId, location) {
  const res = await axiosInstance.post(`/location/send/${receiverId}`, { location });
  return res.data;
}

export async function startLiveLocationSession(receiverId, intervalMs) {
  const res = await axiosInstance.post("/location/live/start", { receiverId, intervalMs });
  return res.data.session;
}

export async function pingLiveLocationSession(sessionId, location, { force = false } = {}) {
  const res = await axiosInstance.post(`/location/live/${sessionId}/ping`, { location, force });
  return res.data;
}

export async function stopLiveLocationSession(sessionId, { sendEndMessage = true } = {}) {
  const res = await axiosInstance.post(`/location/live/${sessionId}/stop`, { sendEndMessage });
  return res.data;
}

export async function getActiveLiveLocationSession() {
  const res = await axiosInstance.get("/location/live/active");
  return res.data.session;
}
