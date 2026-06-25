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
import { requestNotificationPermission, showBrowserNotification } from "../lib/browserNotifications";
import { getMessagePreview } from "../lib/messagePreview";
import { playMessageSound } from "../hooks/useMessageSound";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

const LIVE_LOCATION_NOTIFY_THROTTLE_MS = 30000;
const MARK_READ_DEBOUNCE_MS = 1000;

let markReadDebounceTimer = null;

function buildUnreadCountsFromConversations(conversations) {
  const unreadCounts = {};
  for (const conversation of conversations) {
    const count = conversation.unreadCount ?? 0;
    if (count > 0) {
      unreadCounts[String(conversation._id)] = count;
    }
  }
  return unreadCounts;
}

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
      isKeyboardSoundEnabled: true,
      isNotificationSoundEnabled: true,
      areBrowserNotificationsEnabled: false,
      isSendingMedia: false,
      isSendingText: false,
      isForwardingMessage: false,
      isSendingLocation: false,
      emergencyLocationSession: null,
      unreadCounts: {},
      liveLocationNotifyState: null,
      replyingTo: null,

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
          set({
            conversations: res.data,
            unreadCounts: buildUnreadCountsFromConversations(res.data),
          });
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
        const { selectedUser } = get();
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
            messages: [...get().messages, res.data],
            ...(shouldClearComposer && get().composerText.trim() === messageData.text?.trim()
              ? { composerText: "", replyingTo: null }
              : {}),
          });
          get().getConversations();
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send message");
          return false;
        }
      },

      findUserById: (userId) => {
        const id = String(userId);
        const { users, conversations } = get();
        return (
          users.find((user) => String(user._id) === id) ||
          conversations.find((user) => String(user._id) === id) ||
          null
        );
      },

      shouldNotifyForMessage: (message) => {
        if (!message.isLiveLocation || !message.liveSessionId) {
          return true;
        }

        const sessionId = message.liveSessionId;
        const now = Date.now();
        const { liveLocationNotifyState } = get();

        if (
          liveLocationNotifyState?.sessionId === sessionId &&
          now - liveLocationNotifyState.timestamp < LIVE_LOCATION_NOTIFY_THROTTLE_MS
        ) {
          return false;
        }

        set({ liveLocationNotifyState: { sessionId, timestamp: now } });
        return true;
      },

      triggerMessageAlerts: (message) => {
        const senderId = String(message.senderId);
        const sender = get().findUserById(senderId);
        const senderName = sender?.fullName ?? "New message";
        const preview = getMessagePreview(message);

        toast(`${senderName}: ${preview}`, {
          id: message.isLiveLocation ? `live-${message.liveSessionId}` : `msg-${message._id}`,
        });

        if (get().isNotificationSoundEnabled) {
          playMessageSound();
        }

        if (
          get().areBrowserNotificationsEnabled &&
          document.hidden &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          showBrowserNotification({
            title: senderName,
            body: preview,
            icon: sender?.profilePic ?? sender?.profilePicture,
            onClick: () => get().setActiveConversationId(senderId),
          });
        }
      },

      handleIncomingMessage: (newMessage) => {
        const authUser = useAuthStore.getState().authUser;
        if (!authUser) return;
        if (String(newMessage.receiverId) !== String(authUser._id)) return;

        const senderId = String(newMessage.senderId);
        const { activeConversationId, messages } = get();
        const isActiveChat = senderId === String(activeConversationId);

        if (isActiveChat) {
          set({ messages: [...messages, newMessage] });
          get().scheduleMarkConversationRead(senderId);
          get().getConversations();
          return;
        }

        const unreadCounts = { ...get().unreadCounts };
        unreadCounts[senderId] = (unreadCounts[senderId] ?? 0) + 1;
        set({ unreadCounts });

        if (get().shouldNotifyForMessage(newMessage)) {
          get().triggerMessageAlerts(newMessage);
        }

        get().getConversations();
      },

      handleMessageDeleted: ({ messageId }) => {
        if (!messageId) return;

        const id = String(messageId);
        set({
          messages: get().messages.filter((message) => String(message._id) !== id),
        });
        get().getConversations();
      },

      setReplyingTo: (replyingTo) => set({ replyingTo }),

      clearReplyingTo: () => set({ replyingTo: null }),

      deleteMessage: async (messageId) => {
        if (!messageId) return false;

        try {
          await axiosInstance.delete(`/messages/item/${messageId}`);
          get().handleMessageDeleted({ messageId });
          toast.success("Message deleted");
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete message");
          return false;
        }
      },

      forwardMessage: async ({ messageId, receiverId }) => {
        if (!messageId || !receiverId) return false;

        set({ isForwardingMessage: true });
        try {
          await axiosInstance.post(`/messages/forward/${messageId}`, { receiverId });
          toast.success("Message forwarded");
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to forward message");
          return false;
        } finally {
          set({ isForwardingMessage: false });
        }
      },

      markConversationRead: async (peerId) => {
        if (!peerId) return;

        const peerKey = String(peerId);
        const unreadCounts = { ...get().unreadCounts };
        delete unreadCounts[peerKey];
        set({ unreadCounts });

        try {
          await axiosInstance.patch(`/messages/read/${peerId}`);
          get().getConversations();
        } catch (error) {
          console.error("Failed to mark conversation as read", error);
        }
      },

      scheduleMarkConversationRead: (peerId) => {
        if (!peerId) return;

        if (markReadDebounceTimer) {
          clearTimeout(markReadDebounceTimer);
        }

        markReadDebounceTimer = setTimeout(() => {
          markReadDebounceTimer = null;
          axiosInstance.patch(`/messages/read/${peerId}`).catch((error) => {
            console.error("Failed to mark conversation as read", error);
          });
        }, MARK_READ_DEBOUNCE_MS);
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
      setKeyboardSoundEnabled: (isKeyboardSoundEnabled) => set({ isKeyboardSoundEnabled }),

      setNotificationAlertsEnabled: async (enabled) => {
        if (enabled) {
          const permission = await requestNotificationPermission();
          set({
            isNotificationSoundEnabled: true,
            areBrowserNotificationsEnabled: permission === "granted",
          });

          if (permission !== "granted") {
            toast.error("Browser notifications were not allowed");
          }

          return;
        }

        set({
          isNotificationSoundEnabled: false,
          areBrowserNotificationsEnabled: false,
        });
      },

      sendTextMessage: async (conversationId) => {
        if (get().isSendingText) return false;

        const messageText = get().composerText.trim();
        if (!conversationId || !messageText) return false;

        const { replyingTo } = get();
        const payload = {
          text: messageText,
          ...(replyingTo
            ? {
                replyTo: {
                  messageId: replyingTo.messageId,
                  text: replyingTo.text,
                  senderName: replyingTo.senderName,
                },
              }
            : {}),
        };

        set({ isSendingText: true, composerText: "" });

        try {
          const didSend = await get().sendMessage(payload);

          if (!didSend) {
            set({ composerText: messageText });
          } else if (replyingTo) {
            set({ replyingTo: null });
          }

          return didSend;
        } finally {
          set({ isSendingText: false });
        }
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
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState ?? {};

        return {
          ...state,
          isKeyboardSoundEnabled:
            state.isKeyboardSoundEnabled ?? state.isSoundEnabled ?? true,
          isNotificationSoundEnabled: state.isNotificationSoundEnabled ?? true,
          areBrowserNotificationsEnabled: state.areBrowserNotificationsEnabled ?? false,
        };
      },
      partialize: (state) => ({
        isKeyboardSoundEnabled: state.isKeyboardSoundEnabled,
        isNotificationSoundEnabled: state.isNotificationSoundEnabled,
        areBrowserNotificationsEnabled: state.areBrowserNotificationsEnabled,
      }),
    },
  ),
);
