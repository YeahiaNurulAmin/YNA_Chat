import { Room, RoomEvent, Track } from "livekit-client";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

let room = null;
const remoteAudioElements = new Set();

function detachRemoteAudio() {
  for (const element of remoteAudioElements) {
    element.remove();
  }
  remoteAudioElements.clear();
}

export function getLivekitRoom() {
  return room;
}

export async function connectToRoom(token) {
  if (!LIVEKIT_URL) {
    throw new Error("LiveKit URL is not configured");
  }

  if (room) {
    await disconnectFromRoom();
  }

  const nextRoom = new Room({
    adaptiveStream: true,
    dynacast: true,
  });

  nextRoom.on(RoomEvent.TrackSubscribed, (track) => {
    if (track.kind !== Track.Kind.Audio) return;
    const element = track.attach();
    element.style.display = "none";
    document.body.appendChild(element);
    remoteAudioElements.add(element);
  });

  nextRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
    track.detach().forEach((element) => {
      remoteAudioElements.delete(element);
      element.remove();
    });
  });

  await nextRoom.connect(LIVEKIT_URL, token);

  try {
    await nextRoom.localParticipant.setMicrophoneEnabled(true);
  } catch (error) {
    console.error("Microphone access denied:", error);
    throw error;
  }

  room = nextRoom;
  return nextRoom;
}

export async function disconnectFromRoom() {
  detachRemoteAudio();

  if (!room) return;

  const currentRoom = room;
  room = null;
  await currentRoom.disconnect();
}

export async function setMicrophoneMuted(isMuted) {
  const activeRoom = getLivekitRoom();
  if (!activeRoom) {
    throw new Error("No active call room");
  }

  const participant = activeRoom.localParticipant;
  let handled = false;

  for (const [, publication] of participant.audioTrackPublications) {
    if (isMuted) {
      await publication.mute();
    } else {
      await publication.unmute();
    }
    handled = true;
  }

  if (!handled) {
    await participant.setMicrophoneEnabled(!isMuted);
  }
}

export function waitForRoomConnected(timeoutMs = 15000) {
  if (!room) return Promise.reject(new Error("No active room"));

  if (room.state === "connected") {
    return Promise.resolve(room);
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Connection timed out"));
    }, timeoutMs);

    const onConnected = () => {
      cleanup();
      resolve(room);
    };

    const onDisconnected = () => {
      cleanup();
      reject(new Error("Disconnected before connect"));
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      room?.off(RoomEvent.Connected, onConnected);
      room?.off(RoomEvent.Disconnected, onDisconnected);
    };

    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
  });
}
