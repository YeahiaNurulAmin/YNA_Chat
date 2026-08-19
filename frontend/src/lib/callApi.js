import { axiosInstance } from "./axios";

export async function inviteCall(peerId, callType = "audio") {
  const res = await axiosInstance.post("/calls/invite", { peerId, callType });
  return res.data;
}

export async function acceptCall(callId) {
  const res = await axiosInstance.post("/calls/accept", { callId });
  return res.data;
}

export async function rejectCall(callId) {
  const res = await axiosInstance.post("/calls/reject", { callId });
  return res.data;
}

export async function endCall({ callId, roomName } = {}) {
  const res = await axiosInstance.post("/calls/end", { callId, roomName });
  return res.data;
}
