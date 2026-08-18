// Central configuration for connecting to the YNA Chat backend.
//
// The Figma Make preview cannot reach a developer's localhost backend, so the
// app defaults to mock data. To connect to the real backend, set
// VITE_API_BASE_URL (and provide a token via setTokenProvider) — every theme
// then switches to live data with no further code changes.

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

/** Base REST URL, e.g. "http://localhost:3000/api". */
export const API_BASE_URL: string = env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

/** Socket.IO server origin (REST base minus the trailing "/api"). */
export const SOCKET_URL: string = env.VITE_SOCKET_URL ?? API_BASE_URL.replace(/\/api\/?$/, "");

// A pluggable token provider. Swap in Clerk's `getToken` at app bootstrap:
//   setTokenProvider(() => clerk.session?.getToken())
let tokenProvider: () => Promise<string | null> | string | null = () => null;

export function setTokenProvider(provider: () => Promise<string | null> | string | null) {
  tokenProvider = provider;
}

export async function getToken(): Promise<string | null> {
  return await tokenProvider();
}

// When true, the data layer serves mock data instead of hitting the network.
// Enabled explicitly via VITE_USE_MOCK, and by default whenever no live backend
// override is configured (i.e. we're running inside the preview).
export const USE_MOCK: boolean =
  env.VITE_USE_MOCK === "true" || (!env.VITE_API_BASE_URL && env.VITE_USE_MOCK !== "false");
