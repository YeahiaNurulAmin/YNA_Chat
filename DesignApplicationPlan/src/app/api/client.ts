// Typed REST client for the YNA Chat backend.
// One function per endpoint documented in src/imports/API_ENDPOINTS.md.

import { API_BASE_URL, getToken } from "./config";
import type {
  CallInvite,
  Conversation,
  LiveLocationSession,
  LocationConfig,
  LocationPin,
  Message,
  SendMessagePayload,
  User,
} from "./types";

async function authHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: await authHeaders(),
  });
  return handle<T>(res);
}

async function sendJSON<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handle<T>(res);
}

// ---- System ----
export function healthCheck(): Promise<{ message: string; ok: boolean }> {
  return getJSON("/../health");
}

// ---- Auth ----
export function checkAuth(): Promise<User> {
  return getJSON<User>("/auth/check");
}

// ---- Messaging ----
export function getUsers(): Promise<User[]> {
  return getJSON<User[]>("/messages/users");
}

export function getConversations(): Promise<Conversation[]> {
  return getJSON<Conversation[]>("/messages/conversations");
}

export function getMessages(peerId: string): Promise<Message[]> {
  return getJSON<Message[]>(`/messages/${peerId}`);
}

export async function sendMessage(peerId: string, payload: SendMessagePayload): Promise<Message> {
  const hasFiles = (payload.media && payload.media.length > 0) || !!payload.voice;

  if (hasFiles) {
    const form = new FormData();
    if (payload.text) form.append("text", payload.text);
    (payload.media ?? []).forEach((file) => form.append("media", file));
    if (payload.voice) form.append("voice", payload.voice);
    if (payload.replyTo) form.append("replyTo", JSON.stringify(payload.replyTo));
    const res = await fetch(`${API_BASE_URL}/messages/send/${peerId}`, {
      method: "POST",
      headers: await authHeaders(), // no Content-Type: browser sets multipart boundary
      body: form,
    });
    return handle<Message>(res);
  }

  return sendJSON<Message>(`/messages/send/${peerId}`, "POST", {
    text: payload.text,
    replyTo: payload.replyTo,
  });
}

export function forwardMessage(messageId: string, receiverId: string): Promise<Message> {
  return sendJSON<Message>(`/messages/forward/${messageId}`, "POST", { receiverId });
}

export function markRead(peerId: string): Promise<{ ok: boolean; modifiedCount: number }> {
  return sendJSON(`/messages/read/${peerId}`, "PATCH");
}

export function deleteMessage(messageId: string): Promise<{ ok: boolean; messageId: string }> {
  return sendJSON(`/messages/item/${messageId}`, "DELETE");
}

// ---- Location ----
export function getLocationConfig(): Promise<LocationConfig> {
  return getJSON<LocationConfig>("/location/config");
}

export function sendLocation(peerId: string, location: LocationPin): Promise<{ message: Message }> {
  return sendJSON(`/location/send/${peerId}`, "POST", { location });
}

export function getActiveLiveLocation(): Promise<{ session: LiveLocationSession | null }> {
  return getJSON("/location/live/active");
}

export function startLiveLocation(
  receiverId: string,
  intervalMs: number,
): Promise<{ session: LiveLocationSession }> {
  return sendJSON("/location/live/start", "POST", { receiverId, intervalMs });
}

export function pingLiveLocation(
  sessionId: string,
  location: Pick<LocationPin, "lat" | "lng">,
  force = false,
): Promise<{ message: Message; session: LiveLocationSession; location: LocationPin }> {
  return sendJSON(`/location/live/${sessionId}/ping`, "POST", { location, force });
}

export function stopLiveLocation(
  sessionId: string,
  sendEndMessage = true,
): Promise<{ session: LiveLocationSession; endMessage?: Message }> {
  return sendJSON(`/location/live/${sessionId}/stop`, "POST", { sendEndMessage });
}

// ---- Voice calls ----
export function inviteCall(peerId: string): Promise<CallInvite> {
  return sendJSON<CallInvite>("/calls/invite", "POST", { peerId });
}

export function acceptCall(callId: string): Promise<{ roomName: string; token: string }> {
  return sendJSON("/calls/accept", "POST", { callId });
}

export function rejectCall(callId: string): Promise<{ message: string }> {
  return sendJSON("/calls/reject", "POST", { callId });
}

export function endCall(callId: string, roomName: string): Promise<{ message: string }> {
  return sendJSON("/calls/end", "POST", { callId, roomName });
}
