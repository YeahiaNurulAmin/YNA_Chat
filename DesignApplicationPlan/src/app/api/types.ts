// Type definitions matching the YNA Chat backend API payloads.
// Source of truth: src/imports/API_ENDPOINTS.md

export interface User {
  _id: string;
  clerkId?: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationPin {
  lat: number;
  lng: number;
  label?: string;
}

export interface ReplyTo {
  messageId: string;
  text: string;
  senderName: string;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image: string[];
  video: string[];
  voice: string[];
  audio: string[];
  document: string[];
  location?: LocationPin | null;
  replyTo?: ReplyTo | null;
  readAt?: string | null;
  createdAt: string;
  // Client-only: duration (seconds) for a recorded voice memo, used by the
  // voice player UI. Not part of the server payload.
  voiceDurationSec?: number;
}

export interface Conversation {
  _id: string; // peer user id
  fullName: string;
  profilePic?: string;
  email: string;
  unreadCount: number;
  lastMessage: Message | null;
}

export interface LiveLocationSession {
  sessionId: string;
  senderId: string;
  receiverId: string;
  intervalMs: number;
  updateCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface LocationConfig {
  reverseGeocodingEnabled: boolean;
  defaultIntervalMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
}

export interface CallInvite {
  callId: string;
  roomName: string;
  token: string;
}

export interface IncomingCall {
  callId: string;
  roomName: string;
  caller: Pick<User, "_id" | "fullName"> & { profilePic?: string };
}

// Payload for composing a message via the send endpoint.
export interface SendMessagePayload {
  text?: string;
  media?: File[]; // up to 10 images/videos/audio/docs
  voice?: File; // single voice note
  replyTo?: ReplyTo;
}

// ---- Socket.IO event payload maps ----

export interface ServerToClientEvents {
  getOnlineUsers: (userIds: string[]) => void;
  newMessage: (message: Message) => void;
  messageDeleted: (payload: { messageId: string; senderId: string; receiverId: string }) => void;
  "call:incoming": (payload: IncomingCall) => void;
  "call:accepted": (payload: { callId: string; roomName: string }) => void;
  "call:rejected": (payload: { callId: string }) => void;
  "call:ended": (payload: { callId: string; roomName: string; reason?: string }) => void;
}

export interface ClientToServerEvents {
  "call:cancel": () => void;
  "call:reject": (payload: { callId: string }) => void;
  "call:end": (payload: { callId: string; roomName: string }) => void;
}
