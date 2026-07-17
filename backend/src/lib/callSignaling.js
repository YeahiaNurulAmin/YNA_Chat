import { deleteRoom } from "./livekit.js";

const activeCalls = new Map();
const userCallIndex = new Map();

export function getCallById(callId) {
  return activeCalls.get(callId) ?? null;
}

export function getActiveCallForUser(userId) {
  const callId = userCallIndex.get(String(userId));
  if (!callId) return null;
  return activeCalls.get(callId) ?? null;
}

export function findCallByRoomName(roomName) {
  for (const call of activeCalls.values()) {
    if (call.roomName === roomName) return call;
  }
  return null;
}

export function registerCall(call) {
  activeCalls.set(call.callId, call);
  userCallIndex.set(String(call.callerId), call.callId);
  userCallIndex.set(String(call.calleeId), call.callId);
}

export function clearCall(call) {
  activeCalls.delete(call.callId);
  userCallIndex.delete(String(call.callerId));
  userCallIndex.delete(String(call.calleeId));
}

async function notifyPeerEnded(io, getReceiverSocketId, call, reason, endedByUserId) {
  const peerId =
    String(endedByUserId) === String(call.callerId) ? call.calleeId : call.callerId;
  const peerSocketId = getReceiverSocketId(peerId);

  if (peerSocketId) {
    io.to(peerSocketId).emit("call:ended", {
      callId: call.callId,
      roomName: call.roomName,
      reason,
    });
  }
}

export async function cleanupCall(io, getReceiverSocketId, call, reason, endedByUserId) {
  await notifyPeerEnded(io, getReceiverSocketId, call, reason, endedByUserId);
  clearCall(call);
  await deleteRoom(call.roomName);
}

export async function rejectCall(io, getReceiverSocketId, call, calleeId) {
  const callerSocketId = getReceiverSocketId(call.callerId);
  if (callerSocketId) {
    io.to(callerSocketId).emit("call:rejected", { callId: call.callId });
  }
  await cleanupCall(io, getReceiverSocketId, call, "rejected", calleeId);
}

export async function acceptCallSignaling(io, getReceiverSocketId, call) {
  const callerSocketId = getReceiverSocketId(call.callerId);
  if (callerSocketId) {
    io.to(callerSocketId).emit("call:accepted", {
      callId: call.callId,
      roomName: call.roomName,
    });
  }

  call.status = "active";
  activeCalls.set(call.callId, call);
}

export async function endCallForUser(io, getReceiverSocketId, userId, reason) {
  const call = getActiveCallForUser(userId);
  if (!call) return null;
  await cleanupCall(io, getReceiverSocketId, call, reason, userId);
  return call;
}

export function registerCallSocketHandlers(socket, io, getReceiverSocketId) {
  const userId = socket.data.userId;

  socket.on("call:cancel", async () => {
    const call = getActiveCallForUser(userId);
    if (!call || String(call.callerId) !== String(userId) || call.status !== "ringing") return;
    await cleanupCall(io, getReceiverSocketId, call, "cancelled", userId);
  });

  socket.on("call:reject", async ({ callId }) => {
    const call = callId ? getCallById(callId) : getActiveCallForUser(userId);
    if (!call || String(call.calleeId) !== String(userId)) return;
    await rejectCall(io, getReceiverSocketId, call, userId);
  });

  socket.on("call:end", async ({ callId, roomName } = {}) => {
    let call = callId ? getCallById(callId) : getActiveCallForUser(userId);
    if (!call && roomName) {
      call = findCallByRoomName(roomName);
    }

    if (!call) {
      if (roomName) await deleteRoom(roomName);
      return;
    }

    if (![String(call.callerId), String(call.calleeId)].includes(String(userId))) return;
    await cleanupCall(io, getReceiverSocketId, call, "ended", userId);
  });
}
