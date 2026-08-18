// Socket.IO real-time client wrapper for the YNA Chat backend.
//
// Events mirror src/imports/API_ENDPOINTS.md. The socket.io-client import is
// loaded lazily so the app still builds/renders in preview (mock mode) even if
// the package is not installed yet. No connection is made while USE_MOCK.

import { SOCKET_URL, USE_MOCK, getToken } from "./config";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

type AnySocket = {
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  off: (event: string, cb?: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  disconnect: () => void;
};

let socket: AnySocket | null = null;

/** Establish the socket connection using the current auth token. No-op in mock mode. */
export async function connectSocket(): Promise<AnySocket | null> {
  if (USE_MOCK || socket) return socket;
  try {
    const { io } = await import("socket.io-client");
    const token = await getToken();
    socket = io(SOCKET_URL, { auth: { token } }) as unknown as AnySocket;
    return socket;
  } catch {
    // Package missing or connection failed — stay in offline/mock mode gracefully.
    return null;
  }
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// ---- Server -> client subscriptions. Each returns an unsubscribe fn. ----
export function onEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E],
): () => void {
  const cb = handler as (...args: unknown[]) => void;
  socket?.on(event as string, cb);
  return () => socket?.off(event as string, cb);
}

// ---- Client -> server emits ----
export function emitEvent<E extends keyof ClientToServerEvents>(
  event: E,
  ...args: Parameters<ClientToServerEvents[E]>
): void {
  socket?.emit(event as string, ...(args as unknown[]));
}
