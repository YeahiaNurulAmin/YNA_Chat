# YNA Chat

A full-stack, real-time 1:1 messaging application with rich media support, location sharing, live location tracking, and a polished customizable UI. Built as a monolith-friendly architecture: a React SPA talks to an Express API and Socket.io server, with MongoDB for persistence and Clerk for authentication.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Database & Seeding](#database--seeding)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Real-Time Events (Socket.io)](#real-time-events-socketio)
- [Location System](#location-system)
- [Media Uploads](#media-uploads)
- [Frontend State & UX](#frontend-state--ux)
- [UI Customization](#ui-customization)
- [Docker Deployment](#docker-deployment)
- [Production Notes](#production-notes)
- [Roadmap](#roadmap)

---

## Overview

**YNA Chat** is a modern chat application designed for direct (1:1) conversations between registered users. Each user signs in through [Clerk](https://clerk.com); their profile is synced into MongoDB so the app can store messages, track read receipts, and power the sidebar.

The app supports:

- Text messages with replies
- Images, videos, audio files, documents, and voice notes
- Static map pins and continuous live location sharing
- Online presence indicators
- Unread counts, browser notifications, and optional sound alerts
- Light/dark mode, theme presets, and chat wallpapers

In **development**, the frontend (Vite on port `5173`) and backend (Express on port `3000`) run separately. In **production**, a single Docker image serves the built React app as static files from Express while the API and WebSocket server run on the same host.

---

## Features

### Messaging

| Feature | Description |
|---------|-------------|
| **1:1 conversations** | Chat with any other registered user |
| **Text messages** | Plain text with optional reply-to quoting |
| **Rich media** | Up to 10 files per message: images, videos, audio, PDFs, Office docs, plain text |
| **Voice notes** | Record, preview, and send voice messages (hold-to-record or tap mode) |
| **Message actions** | Delete your own messages; forward messages to another user |
| **Read receipts** | `readAt` timestamp on received messages; conversations show unread counts |
| **Real-time delivery** | New messages and deletions pushed instantly via Socket.io |

### Location

| Feature | Description |
|---------|-------------|
| **Static location** | Pick a point on a map or use device GPS; reverse-geocoded label when configured |
| **Live location** | Share position on an interval (1s – 1hr presets); updates deduplicated by distance and rate |
| **Emergency live location** | Long-press the location button for a dedicated live-sharing session with elapsed timer |
| **Live location grouping** | Consecutive live pings from the same session are grouped in the message list |

### Presence & Notifications

| Feature | Description |
|---------|-------------|
| **Online indicators** | Green dot on avatars for users with an active socket connection |
| **Toast alerts** | In-app toast when a message arrives in a non-active chat |
| **Sound notifications** | Optional message notification sound |
| **Browser notifications** | Optional desktop notifications when the tab is hidden |
| **Document title badge** | Tab title shows total unread count, e.g. `(3) YNA Chat` |
| **Keyboard sounds** | Optional keystroke sounds while typing (persisted preference) |

### UI & Personalization

| Feature | Description |
|---------|-------------|
| **Responsive layout** | Sidebar + chat panel; mobile-friendly conversation switching |
| **HeroUI components** | Buttons, inputs, and design system from `@heroui/react` |
| **Theme presets** | Multiple color presets (Sky, Spotify-style, etc.) |
| **Light / dark mode** | System preference or manual toggle |
| **Wallpapers** | Frame and chat background wallpapers |

---

## Tech Stack

### Frontend (`frontend/`)

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI framework |
| [Vite 8](https://vite.dev/) | Dev server and build tool |
| [React Router 8](https://reactrouter.com/) | Client-side routing (`/`, `/auth`) |
| [Zustand](https://zustand.docs.pmnd.rs/) | Global state (`useAuthStore`, `useChatStore`) |
| [Clerk React](https://clerk.com/docs/references/react/overview) | Sign-in, sign-up, session tokens |
| [Socket.io Client](https://socket.io/) | Real-time messages and presence |
| [Axios](https://axios-http.com/) | HTTP client with Clerk JWT interceptor |
| [HeroUI](https://www.heroui.com/) + [Tailwind CSS 4](https://tailwindcss.com/) | UI components and styling |
| [Leaflet](https://leafletjs.com/) | Map picker and location message display |
| [Lucide React](https://lucide.dev/) | Icons |
| [React Hot Toast](https://react-hot-toast.com/) | Toast notifications |
| React Compiler (Babel plugin) | Automatic memoization |

### Backend (`backend/`)

| Technology | Purpose |
|------------|---------|
| [Node.js](https://nodejs.org/) (ES modules) | Runtime |
| [Express 5](https://expressjs.com/) | HTTP API |
| [Socket.io](https://socket.io/) | WebSocket server for real-time events |
| [MongoDB](https://www.mongodb.com/) + [Mongoose 9](https://mongoosejs.com/) | Database and ODM |
| [Clerk Express](https://clerk.com/docs/references/express/overview) | JWT verification and user API |
| [Multer](https://github.com/expressjs/multer) | In-memory multipart uploads |
| [ImageKit](https://imagekit.io/) | Cloud media storage and CDN URLs |
| [node-cron](https://github.com/node-cron/node-cron) | Production keep-alive health pings |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                        │
│  React SPA · Clerk · Zustand · Socket.io Client · Axios         │
└───────────────┬─────────────────────────────┬───────────────────┘
                │ REST  /api/*                 │ WebSocket
                │ Bearer JWT (Clerk)           │ ?userId=<mongoId>
                ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express + Socket.io (Server)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Auth routes │  │ Message API  │  │ Location service        │ │
│  │ Clerk hook  │  │ ImageKit     │  │ OSM maps · geocoding    │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└───────────────┬─────────────────────────────┬─────────────────────┘
                │                             │
                ▼                             ▼
         ┌─────────────┐              ┌─────────────┐
         │   MongoDB   │              │  ImageKit   │
         │ Users       │              │  (media CDN)│
         │ Messages    │              └─────────────┘
         │ LiveLocation│
         │ Sessions    │
         └─────────────┘
                ▲
                │ Clerk webhooks (user.created / updated / deleted)
         ┌─────────────┐
         │    Clerk    │
         └─────────────┘
```

### Request flow (authenticated API)

1. User signs in via Clerk on the frontend.
2. `App.jsx` registers `getToken` with the Axios interceptor.
3. Every API request sends `Authorization: Bearer <clerk_jwt>`.
4. `protectRoute` middleware reads the Clerk session, resolves the MongoDB user via `findOrSyncUser`, and attaches `req.user`.
5. Controllers read/write MongoDB and optionally emit Socket.io events.

### Message delivery flow

1. Sender POSTs to `/api/messages/send/:receiverId` (or location endpoints).
2. Message is saved to MongoDB via `deliverMessage()`.
3. If the receiver has an active socket, `newMessage` is emitted to their socket ID.
4. Frontend `useChatStore.handleIncomingMessage` updates messages, unread counts, and triggers alerts.

---

## Project Structure

```
YNA_Chat/
├── Dockerfile                 # Multi-stage: build frontend + backend, serve monolith
├── .dockerignore
├── .gitignore
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js              # Express app entry, routes, static SPA in production
│       ├── controllers/
│       │   ├── authControl.js     # GET /auth/check
│       │   ├── messageControl.js  # Users, conversations, messages, send, delete, forward
│       │   └── locationControl.js # Static + live location endpoints
│       ├── Middlewares/
│       │   ├── authMiddelware.js  # Clerk JWT → MongoDB user
│       │   └── updateMiddelware.js# Multer upload config (25MB, allowed MIME types)
│       ├── models/
│       │   ├── User.js
│       │   ├── Message.js
│       │   └── LiveLocationSession.js
│       ├── routes/
│       │   ├── authRoute.js
│       │   ├── messageRoute.js
│       │   └── locationRoute.js
│       ├── lib/
│       │   ├── db.js              # MongoDB connection + readAt migration
│       │   ├── socket.js          # Socket.io server + online user map
│       │   ├── deliverMessage.js  # Save + socket emit helpers
│       │   ├── imagekit.js        # Media upload to ImageKit
│       │   ├── syncClerkUser.js   # Clerk ↔ MongoDB user sync
│       │   ├── cron.js            # Production keep-alive pings
│       │   └── location/
│       │       └── parseLocation.js
│       ├── services/location/
│       │   ├── locationService.js # Static + live location business logic
│       │   └── providers/         # Map tiles (OSM) and geocoding (noop / Nominatim)
│       ├── webhooks/
│       │   └── clerkWebhookMiddleware.js
│       ├── migrations/
│       │   └── backfillReadAt.js
│       └── seed/
│           └── userSeed.js        # 20 demo users for development
│
└── frontend/
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx               # ClerkProvider + BrowserRouter
        ├── App.jsx                # Auth gate, socket listeners, routes
        ├── pages/
        │   ├── ChatPage.jsx
        │   └── AuthPage.jsx
        ├── store/
        │   ├── useAuthStore.js    # authUser, socket, onlineUsers
        │   └── useChatStore.js    # messages, conversations, send/receive logic
        ├── components/
        │   ├── auth/              # Sign-in UI panels
        │   └── chat/              # Sidebar, composer, message bubbles, modals
        ├── context/
        │   ├── ThemeContext.jsx
        │   └── WallpaperContext.jsx
        ├── hooks/                 # Voice recorder, keyboard sound, unread title, etc.
        ├── lib/                   # axios, media, location, notifications
        └── data/                  # Theme presets, wallpapers
```

---

## Prerequisites

- **Node.js** 22+ (used in Dockerfile; 20+ should work locally)
- **npm**
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Clerk** account — [dashboard.clerk.com](https://dashboard.clerk.com)
- **ImageKit** account — required for media uploads ([imagekit.io](https://imagekit.io))
- (Optional) **Nominatim** or other geocoding if you want address labels on location pins

---

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/yna_chat
FRONTEND_URL=http://localhost:5173

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# ImageKit (required for media messages)
IMAGEKIT_PRIVATE_KEY=private_...

# Location providers (optional)
MAP_LINK_PROVIDER=openstreetmap          # default
GEOCODING_PROVIDER=noop                  # noop | nominatim
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=YNA_Chat/1.0

# Production keep-alive (optional; Render sets RENDER_EXTERNAL_URL automatically)
# APP_URL=https://your-app.onrender.com
NODE_ENV=development
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `CLERK_SECRET_KEY` | Yes | Clerk backend secret |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (used by `@clerk/express`) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Yes (prod) | Verifies Clerk webhook payloads |
| `IMAGEKIT_PRIVATE_KEY` | Yes (for media) | Without this, text-only messages work; media returns 500 |
| `FRONTEND_URL` | Dev | CORS origin for API and Socket.io |
| `GEOCODING_PROVIDER` | No | Set to `nominatim` for reverse-geocoded location labels |

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

In development, the API base URL is hardcoded to `http://localhost:3000/api`. In production builds, requests go to `/api` on the same host (monolith).

---

## Local Development

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd YNA_Chat

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

- Create `backend/.env` and `frontend/.env` as described above.
- In the **Clerk Dashboard**:
  - Create an application and copy the publishable + secret keys.
  - Add `http://localhost:5173` as an allowed origin.
  - Configure a webhook endpoint: `http://localhost:3000/api/webhooks/clerk` (use [ngrok](https://ngrok.com/) or similar for local webhook testing).
  - Subscribe to `user.created`, `user.updated`, and `user.deleted`.

### 3. Start MongoDB

```bash
# Example: local MongoDB
mongod
```

Or use a MongoDB Atlas connection string in `MONGODB_URI`.

### 4. (Optional) Seed demo users

```bash
cd backend
npm run seed
```

This upserts 20 fictional users (e.g. Alex Chen, Sam Taylor) with `clerkId` values like `seed_alex_chen`. These are useful for UI development but **cannot sign in via Clerk** unless you create matching Clerk users. Real users are created when someone signs up through Clerk (webhook or first API call sync).

### 5. Run the dev servers

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

Runs Express with `--watch` on port `3000`.

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

Opens Vite on `http://localhost:5173`.

### 6. Verify

- Visit `http://localhost:5173` → redirected to `/auth` if not signed in.
- Health check: `GET http://localhost:3000/health`

---

## Database & Seeding

### Collections

| Collection | Model | Purpose |
|------------|-------|---------|
| `users` | `User` | Profile synced from Clerk (`clerkId`, `fullName`, `email`, `profilePicture`, social fields) |
| `messages` | `Message` | All chat messages and metadata |
| `livelocationsessions` | `LiveLocationSession` | Active/stopped live location sharing sessions |

### Message schema highlights

- `senderId` / `receiverId` — MongoDB ObjectIds referencing `User`
- `text`, `image[]`, `video[]`, `voice[]`, `audio[]`, `document[]` — content fields
- `location` — `{ latitude, longitude, accuracy?, capturedAt?, label? }`
- `isLiveLocation`, `liveSessionId` — live location messages
- `readAt` — `null` until the receiver reads the conversation
- `replyTo` — `{ messageId, text, senderName }` for quoted replies
- `createdAt` / `updatedAt` — automatic timestamps

### Migrations

On startup, `backfillReadAt` runs once to normalize legacy messages missing `readAt`. Failures are logged but do not block the server.

### Seed script

```bash
cd backend && npm run seed
```

---

## Authentication

YNA Chat uses **Clerk** for identity and **MongoDB** for application profiles.

### User sync paths

1. **Clerk webhook** (`POST /api/webhooks/clerk`) — handles `user.created`, `user.updated`, `user.deleted`.
2. **Lazy sync** — on any authenticated request, `findOrSyncUser(clerkId)` fetches the Clerk user and upserts MongoDB if missing.

### Protected routes

All `/api/auth/check`, `/api/messages/*`, and `/api/location/*` routes use `protectRoute`, which:

1. Reads `userId` from the Clerk session (`getAuth(req)`).
2. Loads or creates the MongoDB `User` document.
3. Sets `req.user` (without exposing `clerkId` in most responses).

### Frontend auth flow

1. `ClerkProvider` wraps the app in `main.jsx`.
2. `App.jsx` calls `checkAuth()` when `isSignedIn`, which hits `GET /api/auth/check`.
3. On success, `connectSocket(user)` opens a Socket.io connection with `query: { userId: user._id }`.
4. On sign-out, `clearAuth()` disconnects the socket.

---

## API Reference

Base URL: `http://localhost:3000/api` (development) or `/api` (production).

All endpoints below require `Authorization: Bearer <clerk_jwt>` unless noted.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Server health check |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/check` | Returns the current MongoDB user profile |

### Messages

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/messages/users` | All users except self (for starting new chats) |
| `GET` | `/messages/conversations` | Sidebar list with last message and unread counts |
| `GET` | `/messages/:userId` | Message history with a user; marks incoming as read |
| `POST` | `/messages/send/:receiverId` | Send text, media (`media` field, up to 10), or voice (`voice` field) |
| `PATCH` | `/messages/read/:peerId` | Mark all messages from `peerId` as read |
| `DELETE` | `/messages/item/:messageId` | Delete own message |
| `POST` | `/messages/forward/:messageId` | Forward message to `{ receiverId }` |

**Send message examples:**

```bash
# Text
POST /api/messages/send/<receiverId>
Content-Type: application/json
{ "text": "Hello!", "replyTo": { "messageId": "...", "text": "...", "senderName": "..." } }

# Media (multipart)
POST /api/messages/send/<receiverId>
Content-Type: multipart/form-data
media: <file1>, <file2>, ...

# Voice note
POST /api/messages/send/<receiverId>
Content-Type: multipart/form-data
voice: <audio.webm>
```

### Location

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/location/config` | Map provider, tile layer, limits, frequency presets |
| `POST` | `/location/send/:receiverId` | Send a static location pin |
| `GET` | `/location/live/active` | Get caller's active live session, if any |
| `POST` | `/location/live/start` | Start live sharing `{ receiverId, intervalMs }` |
| `POST` | `/location/live/:sessionId/ping` | Send a live location update `{ location, force? }` |
| `POST` | `/location/live/:sessionId/stop` | Stop session `{ sendEndMessage?: true }` |

### Webhooks (no Bearer token)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/webhooks/clerk` | Clerk user lifecycle events (raw JSON body) |

---

## Real-Time Events (Socket.io)

Connection URL: `http://localhost:3000` (dev) or same origin (prod).  
Query parameter: `userId=<mongodb_user_id>`.

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `getOnlineUsers` | `string[]` (user IDs) | Broadcast whenever the online set changes |
| `newMessage` | `Message` object | New message for the connected receiver |
| `messageDeleted` | `{ messageId }` | Message was deleted (sent to both participants) |

### Client → Server

The client only connects and listens; it does not emit custom events. Presence is tracked via the connection `userId` query and disconnect.

---

## Location System

The location feature is implemented as a dedicated **LocationService** with pluggable providers.

### Static location

1. User picks a point (map modal) or uses GPS.
2. `POST /api/location/send/:receiverId` with `{ location: { latitude, longitude, accuracy?, capturedAt? } }`.
3. Optional reverse geocoding adds a `label` (requires `GEOCODING_PROVIDER=nominatim`).
4. Map links (`mapUrl`, `staticMapUrl`) are enriched via the map provider (OpenStreetMap by default).

### Live location

1. `POST /api/location/live/start` creates a `LiveLocationSession` with a UUID `sessionId` and `intervalMs`.
2. The client periodically calls `POST /api/location/live/:sessionId/ping` with updated coordinates.
3. Server enforces:
   - Minimum interval: `max(session.intervalMs, 2000ms)`
   - Deduplication: skips pings if movement &lt; 5 meters
   - Rate limit: `429` if pings are too frequent (unless `force: true`)
4. `POST /api/location/live/:sessionId/stop` ends the session and optionally sends a "Live location sharing ended" text message.

### Limits (`LOCATION_LIMITS`)

| Limit | Value |
|-------|-------|
| Min interval | 1 second |
| Max interval | 24 hours |
| Min ping gap | 2 seconds |
| Dedupe distance | 5 meters |

### Frontend: emergency live location

Long-pressing the location button in `ChatComposer` opens `EmergencyLocationModal` and uses `useEmergencyLocationSession` to manage automatic pings until the user stops sharing.

---

## Media Uploads

- **Storage:** [ImageKit](https://imagekit.io) CDN (`/chat` folder).
- **Max file size:** 25 MB per file.
- **Max files per message:** 10 (`media` field) + 1 voice note (`voice` field).
- **Allowed types:** images, videos, audio, PDF, Word, Excel, PowerPoint, plain text, RTF.

Upload flow:

1. Multer stores files in memory (`updateMiddelware.js`).
2. `uploadChatMedia()` uploads each file to ImageKit.
3. URLs are stored in the appropriate array field on the `Message` document.

If `IMAGEKIT_PRIVATE_KEY` is not set, media sends fail with `"Media upload is not configured"`.

---

## Frontend State & UX

### `useAuthStore`

| State / Action | Purpose |
|----------------|---------|
| `authUser` | Current MongoDB user from `/auth/check` |
| `socket` | Socket.io instance |
| `onlineUsers` | Array of online user IDs |
| `checkAuth` / `clearAuth` | Sync auth with Clerk session |

### `useChatStore` (partially persisted)

Persisted to `localStorage` as `ynachat-storage`: keyboard sound, notification sound, browser notification preference.

| State / Action | Purpose |
|----------------|---------|
| `users`, `conversations`, `messages` | Chat data |
| `selectedUser`, `activeConversationId` | Current chat |
| `unreadCounts` | Per-conversation unread badges |
| `sendTextMessage`, `sendMediaMessage`, `sendVoiceMessage` | Outbound messages |
| `handleIncomingMessage`, `handleMessageDeleted` | Real-time updates |
| `markConversationRead`, `scheduleMarkConversationRead` | Read receipts (debounced 1s) |
| `deleteMessage`, `forwardMessage` | Message actions |
| `replyingTo` | Reply-to state |
| Live location actions | `startLiveLocationSession`, `pingLiveLocationSession`, `stopLiveLocationSession` |

### Key hooks

| Hook | Purpose |
|------|---------|
| `useSelectedConversation` | Derives active conversation, messages, responsive layout |
| `useUnreadDocumentTitle` | Updates `document.title` with unread count |
| `useMessageSound` | Plays `message-notification.wav` |
| `useKeyboardSound` | Random keystroke MP3s while typing |
| `useVoiceRecorder` | MediaRecorder-based voice notes |
| `useEmergencyLocationSession` | GPS watch + interval pings for live location |

---

## UI Customization

### Themes

- **Light / dark mode** — stored in `localStorage` key `theme`, or follows system preference.
- **Theme presets** — HeroUI color presets (e.g. Sky, Spotify) stored in `theme-preset`; CSS variables in `heroui-theme-presets.css`.

### Wallpapers

`WallpaperContext` applies frame and chat background styles from presets in `data/wallpapers.js`. Users can change wallpaper via `WallpaperPicker` in the sidebar/header.

---

## Docker Deployment

The root `Dockerfile` builds a **production monolith**:

1. **Stage 1:** `npm run build` in `frontend/` → static files in `frontend/dist`.
2. **Stage 2:** `npm run build` in `backend/` → copies `src/` to `dist/`.
3. **Stage 3:** Production Node image serves API from `dist/server.js` and SPA from `public/` (copied frontend build).

```bash
docker build \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_... \
  -t yna-chat .

docker run -p 3001:3001 \
  -e MONGODB_URI="..." \
  -e CLERK_SECRET_KEY="..." \
  -e CLERK_PUBLISHABLE_KEY="..." \
  -e IMAGEKIT_PRIVATE_KEY="..." \
  -e NODE_ENV=production \
  yna-chat
```

The container listens on port **3001** by default (`ENV PORT=3001`). Express serves:

- `/api/*` — REST API
- `/health` — health check
- `/*` — React SPA (`index.html` fallback)

Set `VITE_API_URL` empty at build time so the browser uses relative `/api` paths.

---

## Production Notes

### Keep-alive cron

When `NODE_ENV=production`, `startCronJobs()` pings `/health` every 14 minutes. This prevents cold sleeps on free-tier hosts (e.g. Render). Configure `RENDER_EXTERNAL_URL` or `APP_URL` so pings hit the public URL.

### CORS

Set `FRONTEND_URL` to your production frontend origin if frontend and API are on different hosts. In the monolith Docker setup, same-origin requests do not need CORS changes.

### Clerk webhooks in production

Point the Clerk webhook to `https://your-domain/api/webhooks/clerk` and set `CLERK_WEBHOOK_SIGNING_SECRET`.

### DNS (MongoDB Atlas)

`db.js` sets DNS servers to Google Public DNS (`8.8.8.8`, `8.8.4.4`) to avoid SRV lookup issues on some networks.

---

## Roadmap

Planned but **not yet implemented**:

- **1:1 voice calls** via [LiveKit](https://livekit.io/) (WebRTC media + Socket.io signaling for ring/accept/reject)
- **Hardened Socket.io auth** with Clerk JWT verification on connection

See `.cursor/plans/livekit_audio_calls_a92d556c.plan.md` for the detailed implementation plan.

---

## Scripts Reference

### Backend

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `node --watch src/server.js` | Development server with auto-reload |
| `build` | Copy `src/` → `dist/` | Production bundle |
| `start` | `node dist/server.js` | Run production build |
| `seed` | `node src/seed/userSeed.js` | Seed 20 demo users |

### Frontend

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Development server |
| `build` | `vite build` | Production static build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Lint source files |

---

## License

Backend package declares **ISC** license. See individual `package.json` files for details.

---

## Summary

YNA Chat is a feature-rich real-time messenger built with modern React and Node.js tooling. Clerk handles authentication; MongoDB stores users and messages; Socket.io delivers instant updates; ImageKit hosts media; and a flexible location subsystem supports both one-time pins and live tracking. Run frontend and backend separately for development, or deploy the included Docker image for a single-host production setup.
