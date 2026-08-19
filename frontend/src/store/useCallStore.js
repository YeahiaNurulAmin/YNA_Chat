import { create } from "zustand";
import toast from "react-hot-toast";
import * as callApi from "../lib/callApi";
import {
  connectToRoom,
  disconnectFromRoom,
  setMicrophoneMuted,
  setSpeakerEnabled,
  waitForRoomConnected,
} from "../hooks/useLivekitCall";
import { useAuthStore } from "./useAuthStore";

function mapIncomingCaller(caller) {
  const name = caller.fullName ?? "Unknown";
  return {
    id: caller._id,
    name,
    avatarUrl: caller.profilePic ?? caller.profilePicture,
    initials: name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join(""),
  };
}

let durationTimer = null;

function clearDurationTimer() {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }
}

function startDurationTimer(set) {
  clearDurationTimer();
  durationTimer = setInterval(() => {
    set((state) => {
      if (!state.connectedAt) return state;
      return {
        callDurationSeconds: Math.max(0, Math.floor((Date.now() - state.connectedAt) / 1000)),
      };
    });
  }, 1000);
}

export const useCallStore = create((set, get) => ({
  status: "idle",
  callId: null,
  roomName: null,
  peer: null,
  isMuted: false,
  isSpeakerOn: true,
  callerToken: null,
  connectedAt: null,
  callDurationSeconds: 0,
  error: null,

  reset: () => {
    clearDurationTimer();
    set({
      status: "idle",
      callId: null,
      roomName: null,
      peer: null,
      isMuted: false,
      isSpeakerOn: true,
      callerToken: null,
      connectedAt: null,
      callDurationSeconds: 0,
      error: null,
    });
  },

  startCall: async (peer) => {
    if (get().status !== "idle") return;

    try {
      const data = await callApi.inviteCall(peer.id);
      set({
        status: "outgoing",
        callId: data.callId,
        roomName: data.roomName,
        callerToken: data.token,
        peer,
        error: null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start call");
    }
  },

  cancelCall: () => {
    const { status, callId } = get();
    if (status !== "outgoing" || !callId) return;

    const socket = useAuthStore.getState().socket;
    socket?.emit("call:cancel", { callId });
    set({ status: "missed" });
    window.setTimeout(() => {
      if (get().status === "missed") get().reset();
    }, 2500);
  },

  handleIncomingCall: (payload) => {
    if (get().status !== "idle") return;

    set({
      status: "incoming",
      callId: payload.callId,
      roomName: payload.roomName,
      peer: mapIncomingCaller(payload.caller),
      callerToken: null,
      error: null,
    });
  },

  acceptCall: async () => {
    const { callId, status } = get();
    if (status !== "incoming" || !callId) return;

    try {
      set({ status: "connecting", error: null });
      const data = await callApi.acceptCall(callId);
      set({ roomName: data.roomName });
      await connectToRoom(data.token);
      await waitForRoomConnected();
      set({ status: "active", connectedAt: Date.now(), callDurationSeconds: 0 });
      startDurationTimer(set);
    } catch (error) {
      const message =
        error.name === "NotAllowedError" || error.message?.includes("Microphone")
          ? "Microphone access denied"
          : error.response?.data?.message || "Failed to accept call";
      toast.error(message);
      await disconnectFromRoom();
      get().reset();
    }
  },

  rejectCall: async () => {
    const { callId, status } = get();
    if (status !== "incoming" || !callId) return;

    try {
      await callApi.rejectCall(callId);
    } catch (error) {
      console.error("rejectCall:", error.message);
    } finally {
      get().reset();
    }
  },

  handleCallAccepted: async () => {
    const { status, callerToken } = get();
    if (status !== "outgoing" || !callerToken) return;

    try {
      set({ status: "connecting", error: null });
      await connectToRoom(callerToken);
      await waitForRoomConnected();
      set({ status: "active", connectedAt: Date.now(), callDurationSeconds: 0 });
      startDurationTimer(set);
    } catch (error) {
      const message =
        error.name === "NotAllowedError" || error.message?.includes("Microphone")
          ? "Microphone access denied"
          : "Failed to connect call";
      toast.error(message);
      await disconnectFromRoom();
      get().reset();
    }
  },

  handleCallRejected: () => {
    toast.error("Call declined");
    void disconnectFromRoom();
    get().reset();
  },

  handleCallEnded: async ({ reason } = {}) => {
    const previousStatus = get().status;
    await disconnectFromRoom();
    clearDurationTimer();

    if (reason === "cancelled" && previousStatus === "outgoing") {
      set({ status: "missed" });
      window.setTimeout(() => {
        if (get().status === "missed") get().reset();
      }, 2500);
      return;
    }

    if (reason === "disconnected" && (previousStatus === "connecting" || previousStatus === "active")) {
      toast.error("Call ended — peer disconnected");
    }

    get().reset();
  },

  endCall: async () => {
    const { callId, roomName, status } = get();
    if (!["outgoing", "incoming", "connecting", "active"].includes(status)) return;

    const socket = useAuthStore.getState().socket;
    socket?.emit("call:end", { callId, roomName });

    try {
      await callApi.endCall({ callId, roomName });
    } catch (error) {
      console.error("endCall:", error.message);
    }

    await disconnectFromRoom();
    get().reset();
  },

  toggleMute: async () => {
    const nextMuted = !get().isMuted;
    const previousMuted = get().isMuted;

    set({ isMuted: nextMuted });

    try {
      await setMicrophoneMuted(nextMuted);
    } catch (error) {
      set({ isMuted: previousMuted });
      toast.error("Could not change microphone");
      console.error("toggleMute:", error.message);
    }
  },

  toggleSpeaker: async () => {
    const nextSpeakerOn = !get().isSpeakerOn;
    const previousSpeakerOn = get().isSpeakerOn;

    set({ isSpeakerOn: nextSpeakerOn });

    try {
      await setSpeakerEnabled(nextSpeakerOn);
    } catch (error) {
      set({ isSpeakerOn: previousSpeakerOn });
      toast.error("Could not change speaker output");
      console.error("toggleSpeaker:", error.message);
    }
  },
}));
