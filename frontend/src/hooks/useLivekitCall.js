import { createLocalVideoTrack, Room, RoomEvent, Track } from "livekit-client";
import { useSyncExternalStore } from "react";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

let room = null;
const remoteAudioElements = new Set();

let mediaState = {
  remoteVideoTrack: null,
  remoteVideoMuted: false,
  localCameraTrack: null,
};

const mediaListeners = new Set();

function setMediaState(patch) {
  mediaState = { ...mediaState, ...patch };
  for (const listener of mediaListeners) listener();
}

function getMediaState() {
  return mediaState;
}

function subscribeMedia(listener) {
  mediaListeners.add(listener);
  return () => {
    mediaListeners.delete(listener);
  };
}

export function useCallMediaState() {
  return useSyncExternalStore(subscribeMedia, getMediaState);
}

function detachRemoteAudio() {
  for (const element of remoteAudioElements) {
    element.remove();
  }
  remoteAudioElements.clear();
}

export function getLivekitRoom() {
  return room;
}

export function getLocalCameraTrack() {
  const activeRoom = getLivekitRoom();
  if (!activeRoom) return null;
  return activeRoom.localParticipant.getTrackPublication(Track.Source.Camera)?.track ?? null;
}

async function publishLocalCamera(participant) {
  const cameraTrack = await createLocalVideoTrack();
  await participant.publishTrack(cameraTrack, { source: Track.Source.Camera });
  setMediaState({ localCameraTrack: cameraTrack });
}

export async function connectToRoom(token, { callType = "audio" } = {}) {
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
    if (track.kind === Track.Kind.Audio) {
      const element = track.attach();
      element.style.display = "none";
      document.body.appendChild(element);
      remoteAudioElements.add(element);
      return;
    }

    if (track.source === Track.Source.Camera) {
      setMediaState({ remoteVideoTrack: track, remoteVideoMuted: track.isMuted });
    }
  });

  nextRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
    if (track.kind === Track.Kind.Audio) {
      track.detach().forEach((element) => {
        remoteAudioElements.delete(element);
        element.remove();
      });
      return;
    }

    if (track.source === Track.Source.Camera) {
      setMediaState({ remoteVideoTrack: null, remoteVideoMuted: false });
    }
  });

  nextRoom.on(RoomEvent.TrackMuted, (publication) => {
    if (!publication.isLocal && publication.source === Track.Source.Camera) {
      setMediaState({ remoteVideoMuted: true });
    }
  });

  nextRoom.on(RoomEvent.TrackUnmuted, (publication) => {
    if (!publication.isLocal && publication.source === Track.Source.Camera) {
      setMediaState({ remoteVideoMuted: false });
    }
  });

  nextRoom.on(RoomEvent.LocalTrackUnpublished, (publication) => {
    if (publication.source === Track.Source.Camera) {
      setMediaState({ localCameraTrack: null });
    }
  });

  await nextRoom.connect(LIVEKIT_URL, token);

  try {
    await nextRoom.localParticipant.setMicrophoneEnabled(true);
  } catch (error) {
    console.error("Microphone access denied:", error);
    throw error;
  }

  if (callType === "video") {
    try {
      await publishLocalCamera(nextRoom.localParticipant);
    } catch (error) {
      console.error("Camera access denied:", error);
      throw error;
    }
  }

  room = nextRoom;
  return nextRoom;
}

export async function disconnectFromRoom() {
  detachRemoteAudio();

  setMediaState({
    remoteVideoTrack: null,
    remoteVideoMuted: false,
    localCameraTrack: null,
  });

  if (!room) return;

  const currentRoom = room;
  room = null;

  try {
    const cameraPublication = currentRoom.localParticipant.getTrackPublication(Track.Source.Camera);
    if (cameraPublication?.track) {
      await currentRoom.localParticipant.unpublishTrack(cameraPublication.track, true);
    }
  } catch (error) {
    console.warn("disconnectFromRoom:", error.message);
  }

  await currentRoom.disconnect();
}

export function setSpeakerEnabled(enabled) {
  const volume = enabled ? 1 : 0;
  for (const element of remoteAudioElements) {
    element.volume = volume;
  }
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

export async function setCameraEnabled(enabled) {
  const activeRoom = getLivekitRoom();
  if (!activeRoom) {
    throw new Error("No active call room");
  }

  const participant = activeRoom.localParticipant;
  await participant.setCameraEnabled(enabled);

  const pub = participant.getTrackPublication(Track.Source.Camera);
  setMediaState({ localCameraTrack: pub?.track ?? null });
}

export async function switchCameraFacingMode() {
  const activeRoom = getLivekitRoom();
  if (!activeRoom) {
    throw new Error("No active call room");
  }

  const participant = activeRoom.localParticipant;
  const publication = participant.getTrackPublication(Track.Source.Camera);
  if (!publication?.track) return;

  const settings = publication.track.mediaStreamTrack?.getSettings?.() ?? {};
  const nextFacingMode = settings.facingMode === "environment" ? "user" : "environment";

  await participant.unpublishTrack(publication.track, true);
  const cameraTrack = await createLocalVideoTrack({ videoFacingMode: nextFacingMode });
  await participant.publishTrack(cameraTrack, { source: Track.Source.Camera });
  setMediaState({ localCameraTrack: cameraTrack });
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