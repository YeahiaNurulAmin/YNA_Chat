# YNA Chat — Four Distinct Messenger Themes

## Context

The user wants a UI/UX exploration of a messenger interface rendered as **four genuinely different products**, not palette swaps of one layout. Each theme must be internally consistent across chat bubbles, avatars, username labels, input field, and buttons/icons.

**The user has a real backend** (documented in `src/imports/API_ENDPOINTS.md`) and wants the frontend **ready to connect** to it. So this build has two halves: (1) a complete, typed API + real-time data layer wired to the documented endpoints, and (2) the four themed UIs consuming that layer. Because the Figma Make preview cannot reach the user's `http://localhost:3000` backend, the data layer is written to hit the real API when a base URL/token are configured and reachable, and **gracefully fall back to mock data** so all four themes render in the preview. The four directions:

1. **Full cyber / RGB neon** — near-black bg, neon-outlined bubbles (cyan incoming, magenta outgoing), glowing borders, cyan→magenta gradient avatar rings, monospace/condensed neon-cyan usernames, violet neon input.
2. **Glassmorphism** — frosted translucent panels over blue→purple gradient, semi-transparent white bubbles with backdrop blur + thin white borders (outgoing more opaque), soft translucent avatars, airy/layered like iOS.
3. **Retro terminal** — black bg, monospace throughout, green-on-black (or amber) phosphor, no rounded corners, messages as CLI log with `>`/`<` prefixes, blinking-cursor prompt input.
4. **Playful / colorful** — warm cream bg, big rounded bubbles (16px+), peach/tan incoming + teal/mint outgoing, bold rounded avatar circles, thick colorful rounded input border; warm/casual like Discord.

Goal: four side-by-side-quality reference designs the user can compare.

## Architecture

Each theme is a **fully independent layout component** so structure (not just color) differs. Shared only: mock data + a top-level switcher.

### Backend integration layer (new — makes the frontend "ready to connect")
Built from `src/imports/API_ENDPOINTS.md`. Lives under `src/app/api/`:
- **`src/app/api/types.ts`** — TypeScript interfaces matching API payloads exactly: `User`, `Conversation` (with `lastMessage`, `unreadCount`), `Message` (text/image/video/voice/audio/document arrays, `location`, `replyTo`, `readAt`, `createdAt`), `LiveLocationSession`, `CallInvite`, socket event payloads.
- **`src/app/api/config.ts`** — reads base URL + auth token from a single configurable place (env `VITE_API_BASE_URL` / injected token provider), defaulting to `http://localhost:3000/api`. Exposes a `getToken()` seam (stubbed now; swap in Clerk `getToken` later) and a `USE_MOCK` flag that auto-enables when no reachable backend/token.
- **`src/app/api/client.ts`** — typed `fetch` wrapper attaching `Authorization: Bearer <token>` and JSON/`multipart-form-data` handling, plus one function **per documented endpoint**: `checkAuth`, `getUsers`, `getConversations`, `getMessages(peerId)`, `sendMessage(peerId, {text, media, voice, replyTo})`, `forwardMessage(messageId, receiverId)`, `markRead(peerId)`, `deleteMessage(messageId)`, `getLocationConfig`, `sendLocation`, live-location start/ping/stop/active, and call `invite/accept/reject/end`. Errors surfaced as typed results.
- **`src/app/api/socket.ts`** — `socket.io-client` wrapper (install `socket.io-client`) connecting with `auth: { token }`, typed subscribe helpers for server→client events (`getOnlineUsers`, `newMessage`, `messageDeleted`, `call:incoming/accepted/rejected/ended`) and emit helpers for client→server (`call:cancel/reject/end`). No-op safe when `USE_MOCK`.
- **`src/app/api/mock.ts`** — mock `users`, `conversations`, per-peer `messages` matching the real types (varied message types, timestamps, unread counts, one `location`, one `replyTo`). Used automatically when `USE_MOCK`.
- **`src/app/hooks/useChat.ts`** — a single data hook the themes consume: exposes `conversations`, `users`, `activePeerId`, `messages`, `onlineUserIds`, and actions (`selectConversation`, `sendMessage`, `deleteMessage`, `forwardMessage`). Internally uses `client.ts` + `socket.ts`, falling back to `mock.ts`. This keeps all four themes UI-only and identically fed, so swapping to the live backend is a config change.

### Shared UI pieces
- **`src/app/App.tsx`** — hosts a **theme switcher** (a fixed, unobtrusive segmented control, e.g. top-center pill or bottom-right floating control) with 4 options. Holds `activeTheme` state and renders the matching theme component full-screen. Chat data comes from `useChat` (shared), so switching themes preserves conversation state.

### Theme components (one folder each, each self-contained)
- `src/app/components/themes/cyber/CyberChat.tsx`
- `src/app/components/themes/glass/GlassChat.tsx`
- `src/app/components/themes/terminal/TerminalChat.tsx`
- `src/app/components/themes/playful/PlayfulChat.tsx`

Each theme component renders its own layout: conversation list/sidebar + chat header + message stream + composer, all fed by the shared `useChat` hook (so each is wired to the real backend the moment it's configured). Bubble/avatar/username/input/button styling lives inside each theme (small internal sub-components or inline) so they read as different products. Deliberately vary **layout**, not only palette:
- **Cyber**: 3-column dense HUD feel — left conversation rail, center stream, thin RGB outer frame, glow accents on active items.
- **Glass**: layered floating panels with generous spacing over a gradient; sidebar as a floating frosted card, chat as a second floating card.
- **Terminal**: single monospace column, tmux-like split (contacts as a left `[buffer list]`, chat as a scrollback log); status bar footer; no cards, no radius.
- **Playful**: rounded, bouncy, chunky sidebar with colorful avatar chips, big rounded chat area, sticker-like send button.

### Styling approach
- Use Tailwind utility classes + inline styles for theme-specific effects (neon `box-shadow`, `backdrop-blur`, gradients). Do **not** edit `src/styles/theme.css` global tokens (themes are self-contained and coexist).
- Reuse existing shadcn primitives from `src/app/components/ui/` where they fit the theme (e.g. `ScrollArea`, `Avatar`, `Input`, `Tabs`), but restyle heavily per theme; write custom markup where a primitive fights the aesthetic (terminal especially — mostly raw elements).
- Icons: `lucide-react` (already installed) — Send, Paperclip, Mic, Phone, Search, Settings, etc.
- Avoid Tailwind font-size/weight/line-height utilities per project rules unless the theme's identity requires it (e.g. terminal/cyber monospace); prefer inline styles when overriding is essential.

### Fonts
Add `@import` lines at the **top of `src/styles/fonts.css`** only:
- Monospace for terminal + cyber usernames (e.g. `JetBrains Mono` / `IBM Plex Mono`).
- A rounded, friendly sans for playful (e.g. `Nunito` or `Baloo 2`).
- Glass + cyber body can use a clean geometric sans (e.g. `Inter` / `Space Grotesk`).
Apply fonts via inline `style={{ fontFamily }}` or a wrapper class scoped to each theme root so fonts don't leak between themes.

## Files to create/modify
- Create `src/app/api/types.ts`, `src/app/api/config.ts`, `src/app/api/client.ts`, `src/app/api/socket.ts`, `src/app/api/mock.ts`
- Create `src/app/hooks/useChat.ts`
- Install `socket.io-client` via pnpm
- Create `src/app/components/themes/cyber/CyberChat.tsx`
- Create `src/app/components/themes/glass/GlassChat.tsx`
- Create `src/app/components/themes/terminal/TerminalChat.tsx`
- Create `src/app/components/themes/playful/PlayfulChat.tsx`
- Modify `src/app/App.tsx` (theme switcher + render active theme, feeds `useChat`)
- Modify `src/styles/fonts.css` (font imports only)
- Reuse `src/app/components/figma/ImageWithFallback.tsx` for avatar/image rendering (import the binding, don't hardcode paths).

## Scope notes
- This focuses on the **messenger core** (list → chat → compose) in four themes, per the user's brief, plus the full API/socket client layer covering **all** documented endpoints (messaging, location, calls) so the frontend is genuinely wire-ready.
- Full-blown UI for spec extras (call overlay, live-location modal, RGB customizer modal, auth page) is **out of scope** for this visual pass, but their **client functions/socket handlers are included** in the API layer so they're ready to hook up.
- In preview, `useChat` runs on mock data; pointing `VITE_API_BASE_URL` at the real backend + supplying a Clerk token via the `getToken()` seam switches every theme to live data with no UI changes.

## Verification
1. App dev server is already running — open the Figma Make preview (not localhost).
2. Confirm the theme switcher shows 4 options and switching re-renders the whole experience with a visibly different layout each time.
3. For each theme, verify all five required elements are consistently styled: chat bubbles (incoming vs outgoing distinct), avatars, username labels, input field, buttons/icons.
4. Send a message in each theme and confirm it appends to the stream in that theme's bubble style.
5. Check responsiveness (desktop primary; ensure no horizontal overflow at ~1280px and it degrades gracefully narrower).
6. Confirm fonts load (monospace in terminal/cyber, rounded sans in playful) and don't bleed across themes.
7. Confirm the API layer: `USE_MOCK` renders mock data cleanly in preview with no console errors; verify each `client.ts` function matches the documented method/path/payload in `API_ENDPOINTS.md` (spot-check `sendMessage` multipart fields and `getConversations` shape). Confirm `socket.ts` handlers map to the documented event names. Setting a base URL/token should attempt live calls without code changes.
