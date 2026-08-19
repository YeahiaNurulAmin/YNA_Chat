// Single data hook consumed by every theme. Backed by the real API + socket
// when configured, and by mock data in preview (USE_MOCK). Swapping to the live
// backend is purely a config change — the UI never touches fetch/socket directly.

import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api/client";
import { USE_MOCK } from "../api/config";
import {
  CURRENT_USER,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_ONLINE_IDS,
  MOCK_USERS,
  makeLocalMessage,
  makeLocationMessage,
  makeVoiceMessage,
} from "../api/mock";
import { connectSocket, disconnectSocket, onEvent } from "../api/socket";
import type { Conversation, LocationPin, Message, User } from "../api/types";

export interface UseChat {
  currentUser: User;
  conversations: Conversation[];
  users: User[];
  onlineUserIds: string[];
  activePeerId: string | null;
  activePeer: Conversation | User | null;
  messages: Message[];
  loading: boolean;
  selectConversation: (peerId: string) => void;
  sendText: (text: string) => Promise<void>;
  sendLocation: (location: LocationPin) => Promise<void>;
  sendVoice: (durationSec: number, blob?: Blob | null) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  forwardMessage: (messageId: string, receiverId: string) => Promise<void>;
  isOnline: (userId: string) => boolean;
}

export function useChat(): UseChat {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const mockStore = useRef<Record<string, Message[]>>(structuredCloneSafe(MOCK_MESSAGES));

  // Initial load + socket wiring.
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (USE_MOCK) {
        setConversations(MOCK_CONVERSATIONS);
        setUsers(MOCK_USERS);
        setOnlineUserIds(MOCK_ONLINE_IDS);
        setActivePeerId(MOCK_CONVERSATIONS[0]?._id ?? null);
        setLoading(false);
        return;
      }
      try {
        const [convos, allUsers] = await Promise.all([api.getConversations(), api.getUsers()]);
        if (cancelled) return;
        setConversations(convos);
        setUsers(allUsers);
        setActivePeerId(convos[0]?._id ?? null);
      } catch {
        // fall back to mock if the backend is unreachable
        setConversations(MOCK_CONVERSATIONS);
        setUsers(MOCK_USERS);
        setOnlineUserIds(MOCK_ONLINE_IDS);
        setActivePeerId(MOCK_CONVERSATIONS[0]?._id ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();

    if (!USE_MOCK) {
      const offs: Array<() => void> = [];
      connectSocket().then((s) => {
        if (!s || cancelled) return;
        offs.push(onEvent("getOnlineUsers", (ids) => setOnlineUserIds(ids)));
        offs.push(
          onEvent("newMessage", (m) => {
            setMessages((prev) => (m.senderId === activePeerId || m.receiverId === activePeerId ? [...prev, m] : prev));
          }),
        );
        offs.push(
          onEvent("messageDeleted", ({ messageId }) => {
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
          }),
        );
      });
      return () => {
        cancelled = true;
        offs.forEach((off) => off());
        disconnectSocket();
      };
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages when the active peer changes.
  useEffect(() => {
    if (!activePeerId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    if (USE_MOCK) {
      setMessages(mockStore.current[activePeerId] ?? []);
      return;
    }
    api
      .getMessages(activePeerId)
      .then((msgs) => !cancelled && setMessages(msgs))
      .catch(() => !cancelled && setMessages(mockStore.current[activePeerId] ?? []));
    return () => {
      cancelled = true;
    };
  }, [activePeerId]);

  const selectConversation = useCallback((peerId: string) => setActivePeerId(peerId), []);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !activePeerId) return;

      if (USE_MOCK) {
        const local = makeLocalMessage(activePeerId, trimmed);
        mockStore.current[activePeerId] = [...(mockStore.current[activePeerId] ?? []), local];
        setMessages(mockStore.current[activePeerId]);
        bumpConversation(setConversations, activePeerId, local);
        return;
      }
      try {
        const sent = await api.sendMessage(activePeerId, { text: trimmed });
        setMessages((prev) => [...prev, sent]);
        bumpConversation(setConversations, activePeerId, sent);
      } catch {
        const local = makeLocalMessage(activePeerId, trimmed);
        setMessages((prev) => [...prev, local]);
      }
    },
    [activePeerId],
  );

  const sendLocation = useCallback(
    async (location: LocationPin) => {
      if (!activePeerId) return;
      const appendLocal = () => {
        const local = makeLocationMessage(activePeerId, location);
        if (USE_MOCK) {
          mockStore.current[activePeerId] = [...(mockStore.current[activePeerId] ?? []), local];
          setMessages(mockStore.current[activePeerId]);
        } else {
          setMessages((prev) => [...prev, local]);
        }
        bumpConversation(setConversations, activePeerId, local);
      };
      if (USE_MOCK) return appendLocal();
      try {
        const { message } = await api.sendLocation(activePeerId, location);
        setMessages((prev) => [...prev, message]);
        bumpConversation(setConversations, activePeerId, message);
      } catch {
        appendLocal();
      }
    },
    [activePeerId],
  );

  const sendVoice = useCallback(
    async (durationSec: number, blob?: Blob | null) => {
      if (!activePeerId) return;
      const appendLocal = () => {
        const local = makeVoiceMessage(activePeerId, durationSec);
        if (USE_MOCK) {
          mockStore.current[activePeerId] = [...(mockStore.current[activePeerId] ?? []), local];
          setMessages(mockStore.current[activePeerId]);
        } else {
          setMessages((prev) => [...prev, local]);
        }
        bumpConversation(setConversations, activePeerId, local);
      };
      if (USE_MOCK || !blob) return appendLocal();
      try {
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: blob.type || "audio/webm" });
        const sent = await api.sendMessage(activePeerId, { voice: file });
        setMessages((prev) => [...prev, { ...sent, voiceDurationSec: durationSec }]);
        bumpConversation(setConversations, activePeerId, sent);
      } catch {
        appendLocal();
      }
    },
    [activePeerId],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      if (activePeerId && USE_MOCK) {
        mockStore.current[activePeerId] = (mockStore.current[activePeerId] ?? []).filter((m) => m._id !== messageId);
      }
      if (!USE_MOCK) {
        try {
          await api.deleteMessage(messageId);
        } catch {
          /* optimistic delete already applied */
        }
      }
    },
    [activePeerId],
  );

  const forwardMessage = useCallback(async (messageId: string, receiverId: string) => {
    if (USE_MOCK) return;
    try {
      await api.forwardMessage(messageId, receiverId);
    } catch {
      /* ignore in offline mode */
    }
  }, []);

  const isOnline = useCallback((userId: string) => onlineUserIds.includes(userId), [onlineUserIds]);

  const activePeer =
    conversations.find((c) => c._id === activePeerId) ?? users.find((u) => u._id === activePeerId) ?? null;

  return {
    currentUser: CURRENT_USER,
    conversations,
    users,
    onlineUserIds,
    activePeerId,
    activePeer,
    messages,
    loading,
    selectConversation,
    sendText,
    sendLocation,
    sendVoice,
    deleteMessage,
    forwardMessage,
    isOnline,
  };
}

function bumpConversation(
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>,
  peerId: string,
  last: Message,
) {
  setConversations((prev) => {
    const idx = prev.findIndex((c) => c._id === peerId);
    if (idx === -1) return prev;
    const updated = { ...prev[idx], lastMessage: last, unreadCount: 0 };
    return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
  });
}

function structuredCloneSafe<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
