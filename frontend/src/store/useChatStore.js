import { create } from "zustand";
import { persist } from "zustand/middleware";

import { axiosInstance } from "../lib/axios";
import { validateMediaFiles, MAX_MEDIA_FILE_SIZE } from "../lib/media";
import {
  pingLiveLocationSession as apiPingLiveLocation,
  sendStaticLocation as apiSendStaticLocation,
  startLiveLocationSession as apiStartLiveLocation,
  stopLiveLocationSession as apiStopLiveLocation,
} from "../lib/locationApi";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useChatStore = create(
  persist(
    (set, get) => ({
      users: [],
      conversations: [],
      messages: [],
      selectedUser: null,
      isConversationsLoading: false,
      isUsersLoading: false,
      isMessagesLoading: false,
      activeConversationId: null,
      searchQuery: "",
      sidebarTab: "chats",
      composerText: "",
      isSoundEnabled: true,
      isSendingMedia: false,
      isSendingLocation: false,
      emergencyLocationSession: null,

      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await axiosInstance.get("/messages/users");
          set((state) => ({
            users: res.data,
            selectedUser:
              state.selectedUser && res.data.some((user) => user._id === state.selectedUser._id)
                ? state.selectedUser
                : null,
          }));
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load users");
          console.log("Error in get Users", error.message);
        } finally {
          set({ isUsersLoading: false });
        }
      },

      getConversations: async () => {
        set({ isConversationsLoading: true });
        try {
          const res = await axiosInstance.get("/messages/conversations");
          set({ conversations: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load conversations");
          console.log("Error in getConversations", error.message);
        } finally {
          set({ isConversationsLoading: false });
        }
      },

      getMessages: async (userId) => {
        if (!userId) return;
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          set({ messages: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load messages");
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        if (!selectedUser) return false;

        const isFormData = messageData instanceof FormData;

        // Safety net: route location payloads to the location API (not /messages/send)
        if (!isFormData && messageData?.location) {
          if (messageData.isLiveLocation && messageData.liveSessionId) {
            const result = await get().pingLiveLocationSession({
              sessionId: messageData.liveSessionId,
              location: messageData.location,
            });
            return Boolean(result && !result.skipped);
          }

          return get().sendLocationMessage({
            conversationId: selectedUser._id,
            location: messageData.location,
          });
        }

        const shouldClearComposer =
          !isFormData && Boolean(messageData?.text) && !messageData?.isLiveLocation;

        try {
          const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
          set({
            messages: [...messages, res.data],
            ...(shouldClearComposer ? { composerText: "" } : {}),
          });
          get().getConversations();
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send message");
          return false;
        }
      },

      subscribeToMessages: (userId) => {
        if (!userId) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newMessage");
        socket.on("newMessage", (newMessage) => {
          // if im not the receiver don't do anything just return
          if (String(newMessage.senderId) !== String(userId)) return;

          set({ messages: [...get().messages, newMessage] });

          get().getConversations();
        });
      },

      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket?.off("newMessage");
      },

      setSelectedUser: (selectedUser) => set({ selectedUser }),

      setActiveConversationId: (activeConversationId) => {
        set((state) => ({
          activeConversationId,
          selectedUser:
            state.users.find((user) => user._id === activeConversationId) ||
            state.conversations.find((user) => user._id === activeConversationId) ||
            null,
          messages: activeConversationId ? state.messages : [],
        }));
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
      setComposerText: (composerText) => set({ composerText }),
      setSoundEnabled: (isSoundEnabled) => set({ isSoundEnabled }),

      sendTextMessage: async (conversationId) => {
        const messageText = get().composerText.trim();
        if (!conversationId || !messageText) return false;

        return get().sendMessage({ text: messageText });
      },

      sendMediaMessage: async ({ conversationId, files }) => {
        if (!conversationId || !files?.length) return false;

        const validation = validateMediaFiles(files);
        if (!validation.ok) {
          toast.error(validation.message);
          return false;
        }

        const formData = new FormData();
        for (const file of files) {
          formData.append("media", file);
        }

        set({ isSendingMedia: true });
        try {
          return await get().sendMessage(formData);
        } finally {
          set({ isSendingMedia: false });
        }
      },

      sendVoiceMessage: async ({ conversationId, blob, extension = "webm" }) => {
        if (!conversationId || !blob) return false;

        if (blob.size > MAX_MEDIA_FILE_SIZE) {
          toast.error("Voice message is too large. Max size is 25MB.");
          return false;
        }

        const formData = new FormData();
        formData.append("voice", blob, `voice-note-${Date.now()}.${extension}`);

        set({ isSendingMedia: true });
        try {
          return await get().sendMessage(formData);
        } finally {
          set({ isSendingMedia: false });
        }
      },

      sendLocationMessage: async ({ conversationId, location }) => {
        if (!conversationId || !location) return false;

        const { selectedUser, messages } = get();
        if (!selectedUser || String(selectedUser._id) !== String(conversationId)) return false;

        set({ isSendingLocation: true });
        try {
          const { message: saved } = await apiSendStaticLocation(conversationId, location);
          set({ messages: [...messages, saved] });
          get().getConversations();
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send location");
          return false;
        } finally {
          set({ isSendingLocation: false });
        }
      },

      startLiveLocationSession: async ({ receiverId, intervalMs }) => {
        try {
          const session = await apiStartLiveLocation(receiverId, intervalMs);
          set({
            emergencyLocationSession: {
              sessionId: session.sessionId,
              intervalMs: session.intervalMs,
              conversationId: receiverId,
              startedAt: new Date(session.startedAt).getTime(),
            },
          });
          return session;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to start live location");
          return null;
        }
      },

      pingLiveLocationSession: async ({ sessionId, location, force = false }) => {
        try {
          const result = await apiPingLiveLocation(sessionId, location, { force });
          if (result.message) {
            set({ messages: [...get().messages, result.message] });
            get().getConversations();
          }
          return result;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send live location update");
          return null;
        }
      },

      stopLiveLocationSession: async ({ sessionId, sendEndMessage = true }) => {
        try {
          const result = await apiStopLiveLocation(sessionId, { sendEndMessage });
          if (result.endMessage) {
            set({ messages: [...get().messages, result.endMessage] });
            get().getConversations();
          }
          set({ emergencyLocationSession: null });
          return result;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to stop live location");
          return null;
        }
      },

      setEmergencyLocationSession: (session) => {
        set({ emergencyLocationSession: session });
      },

      stopEmergencyLocationSession: () => {
        set({ emergencyLocationSession: null });
      },
    }),
    {
      name: "ynachat-storage",
      partialize: (state) => ({ isSoundEnabled: state.isSoundEnabled }),
    },
  ),
);
