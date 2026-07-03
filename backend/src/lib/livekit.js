import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

let roomService = null;

function getRoomService() {
  if (!isLivekitConfigured()) {
    throw new Error("LiveKit is not configured");
  }

  if (!roomService) {
    roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  }

  return roomService;
}

export function isLivekitConfigured() {
  return Boolean(LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET);
}

export async function createCallRoom(roomName) {
  const service = getRoomService();
  await service.createRoom({
    name: roomName,
    emptyTimeout: 300,
    maxParticipants: 2,
  });
}

export async function deleteRoom(roomName) {
  if (!roomName || !isLivekitConfigured()) return;

  try {
    const service = getRoomService();
    await service.deleteRoom(roomName);
  } catch (error) {
    console.warn("deleteRoom:", error.message);
  }
}

export async function mintRoomToken({ identity, name, roomName }) {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: String(identity),
    name: name || String(identity),
    ttl: "1h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt();
}
