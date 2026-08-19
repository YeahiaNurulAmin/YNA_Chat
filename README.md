# YNA Chat

A full-stack, real-time 1:1 messaging and WebRTC audio/video calling application with rich media support, location sharing, live location tracking, customizable RGB lighting effects, and a polished modern UI. Built as a monolith-friendly architecture: a React SPA talks to an Express API and Socket.io server, with MongoDB for persistence, Clerk for authentication, ImageKit for media CDN, and LiveKit for WebRTC audio & video calls.

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
- [Audio & Video Calling (LiveKit & WebRTC)](#audio--video-calling-livekit--webrtc)
- [Location System](#location-system)
- [Media Uploads](#media-uploads)
- [Frontend State & UX](#frontend-state--ux)
- [UI Customization & RGB Engine](#ui-customization--rgb-engine)
- [Docker Deployment](#docker-deployment)
- [Production Notes](#production-notes)
- [Roadmap](#roadmap)
- [Scripts Reference](#scripts-reference)
- [License](#license)
- [Summary](#summary)

---

## Overview

**YNA Chat** is a modern chat and WebRTC audio/video calling application designed for direct (1:1) communication between registered users. Each user signs in through [Clerk](https://clerk.com); their profile is automatically synced into MongoDB so the app can store messages, track read receipts, power the sidebar, and manage active voice/video calls.

The app supports:

- **1:1 Voice & Video Calls** over WebRTC via LiveKit with instant Socket.io signaling and Web Audio ring/call sounds
- **Editable profiles** with display name and photo updates that sync through Clerk and apply instantly
- **Text messages** with reply-to quoting and deletion options
- **Rich media** attachments: images, videos, audio files, documents, and interactive voice notes
- **Static map pins** and continuous live location tracking sessions with distance deduplication
- **Online presence indicators** showing real-time socket connectivity
- **Unread counts**, browser desktop notifications, and optional keystroke/message audio alerts
- **Cyber Luxe glassmorphism UI**, theme presets, customizable chat wallpapers, and an adjustable RGB lighting engine

In **development**, the frontend (Vite on port `5173`) and backend (Express on port `3000`) run separately. In **production**, a single multi-stage Docker image serves the built React app as static files from Express while the REST API, Socket.io server, and LiveKit room token generator run on the same host.

---

## Features

### WebRTC Audio & Video Calls

| Feature | Description |
|---------|-------------|
| **1:1 Voice Calls** | High-fidelity WebRTC audio calling powered by LiveKit SFU infrastructure |
| **1:1 Video Calls** | Full WebRTC video calling with remote full-screen stage, local picture-in-picture (PiP) preview, and camera on/off states |
| **Camera controls** | Toggle camera on/off mid-call and switch between front/rear facing modes |
| **Real-time Signaling** | Socket.io signaling for `call:incoming`, `call:accepted`, `call:rejected`, and `call:ended`, carrying `callType` (audio/video) |
| **In-App Call Overlay** | Full-screen glassmorphic call overlay with neon avatar ring, pulsing glow effects, call duration timer, and status pills |
| **Minimized call bar** | Collapse an active call into a compact floating bar with remote video preview; one click restores the full overlay |
| **Synthesized Audio Effects** | Web Audio API generated ringback tones, incoming ringtones, and connection sounds |
| **Call Controls** | Microphone mute toggle, speaker/volume toggle, camera toggle, camera switch, and defensive call termination |

### Messaging

| Feature | Description |
|---------|-------------|
| **1:1 conversations** | Chat with any registered user in real-time |
| **Text messages** | Plain text with optional reply-to message quoting |
| **Rich media** | Up to 10 files per message: images, videos, audio, PDFs, Office docs, plain text |
| **Voice notes** | Record, preview, and send voice messages (hold-to-record or tap mode) |
| **Message actions** | Delete your own messages; forward messages to another user |
| **Read receipts** | `readAt` timestamp on received messages; conversations show unread counts |
| **Real-time delivery** | New messages and deletions pushed instantly via Socket.io |

### Location

| Feature | Description |
|---------|-------------|
| **Static location** | Pick a point on an interactive map or use device GPS; reverse-geocoded address label |
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

### Profile & Settings

| Feature | Description |
|---------|-------------|
| **Profile editing** | Update your display name and profile photo from the settings page; changes sync to Clerk and propagate to the UI immediately |
| **Settings page** | Dedicated settings view with editable profile and personalization options |

### UI & Personalization

| Feature | Description |
|---------|-------------|
| **Cyber Luxe Glassmorphism** | Modern dark/light glass aesthetics, high-end micro-animations |
| **RGB Lighting Engine** | Custom animated RGB glowing aura borders with control over animation speed and brightness |
| **HeroUI components** | Buttons, inputs, and design system from `@heroui/react` |
| **Theme presets** | Multiple color presets (Sky, Spotify-style, Cyberpunk, etc.) |
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
| [Zustand 5](https://zustand.docs.pmnd.rs/) | Global state management (`useAuthStore`, `useChatStore`, `useCallStore`) |
| [Clerk React](https://clerk.com/docs/references/react/overview) | Authentication and session token handling |
| [Socket.io Client](https://socket.io/) | Real-time messages, presence, and call signaling |
| [LiveKit Client](https://docs.livekit.io/) | WebRTC room connection, audio/video track publishing/subscribing, and camera switching |
| [Axios](https://axios-http.com/) | HTTP client with Clerk JWT interceptor |
| [HeroUI](https://www.heroui.com/) + [Tailwind CSS 4](https://tailwindcss.com/) | Design system and styling |
| [Leaflet](https://leafletjs.com/) | Map picker and location message display |
| [Lucide React](https://lucide.dev/) | Icons |
| [React Hot Toast](https://react-hot-toast.com/) | Toast notifications |
| React Compiler (Babel plugin) | Automatic component memoization |

### Backend (`backend/`)

| Technology | Purpose |
|------------|---------|
| [Node.js](https://nodejs.org/) (ES modules) | Runtime environment |
| [Express 5](https://expressjs.com/) | HTTP REST API |
| [Socket.io](https://socket.io/) | WebSocket server for real-time events & signaling |
| [LiveKit Server SDK](https://docs.livekit.io/) | Access token generation and LiveKit room administration |
| [MongoDB](https://www.mongodb.com/) + [Mongoose 9](https://mongoosejs.com/) | Database and ODM |
| [Clerk Express](https://clerk.com/docs/references/express/overview) | JWT verification and user sync |
| [Multer](https://github.com/expressjs/multer) | In-memory multipart uploads |
| [ImageKit](https://imagekit.io/) | Cloud media storage and CDN URLs |
| [node-cron](https://github.com/node-cron/node-cron) | Production keep-alive health pings |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                Browser (Client)                                 │
│  React SPA · Clerk · Zustand · Socket.io Client · LiveKit Client · Axios       │
└───────────────┬───────────────────────┬────────────────────────┬────────────────┘
                │ REST /api/*           │ WebSocket (Signaling)   │ WebRTC Audio
                │ Bearer JWT (Clerk)     │ ?userId=<mongoId>      │ (SRTP / UDP)
                ▼                       ▼                        │
┌────────────────────────────────────────────────────────┐       │
│               Express + Socket.io (Server)             │       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │       │
│  │ Auth routes │  │ Messages API │  │ Location Svc   │ │       │
│  ├─────────────┤  ├──────────────┤  ├────────────────┤ │       │
│  │ Clerk hook  │  │ LiveKit SDK  │  │ Call Signaling │ │       │
│  └─────────────┘  └──────────────┘  └────────────────┘ │       │
└───────────────┬───────────────────────┬────────────────┘       │
                │                       │                        │
                ▼                       ▼                        ▼
         ┌─────────────┐         ┌─────────────┐          ┌──────────────┐
         │   MongoDB   │         │  ImageKit   │          │ LiveKit Server│
         │ Users       │         │ (Media CDN) │          │ (Cloud / SFU)│
         │ Messages    │         └─────────────┘          └──────────────┘
         │ Sessions    │
         └─────────────┘
                ▲
                │ Clerk Webhooks
         ┌─────────────┐
         │    Clerk    │
         └─────────────┘
```

### Request Flow (Authenticated API)

1. User signs in via Clerk on the frontend.
2. `App.jsx` registers `getToken` with the Axios interceptor.
3. Every API request sends `Authorization: Bearer <clerk_jwt>`.
4. `protectRoute` middleware reads the Clerk session, resolves the MongoDB user via `findOrSyncUser`, and attaches `req.user`.
5. Controllers execute business logic and emit real-time Socket.io events.

### Message & Signaling Flow

1. **Messages:** Sent via REST endpoints (`/api/messages/send/:receiverId`). Messages are saved in MongoDB and emitted directly over Socket.io to the receiver's socket ID.
2. **Call Signaling:** Initiated via `/api/calls/invite`. The backend mints a LiveKit room token, emits `call:incoming` (with `callType`) via Socket.io, and manages call lifecycle events (`accept`, `reject`, `end`, `cancel`).
3. **WebRTC Media:** Once connected, raw WebRTC audio flows directly between clients and the LiveKit SFU server.

---

## Project Structure

```
YNA_Chat/
├── Dockerfile                 # Multi-stage build: frontend SPA + Express backend monolith
├── .dockerignore
├── .gitignore
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js              # Express app entry, route registration, static server
│       ├── controllers/
│       │   ├── authControl.js     # GET /auth/check
│       │   ├── messageControl.js  # Users, conversations, messages, send, delete, forward
│       │   ├── locationControl.js # Static + live location endpoints
│       │   └── callControl.js     # LiveKit token minting, call invite/accept/reject/end (audio & video callType)
│       ├── Middlewares/
│       │   ├── authMiddelware.js  # Clerk JWT → MongoDB user resolution
│       │   └── updateMiddelware.js# Multer upload config (25MB limit)
│       ├── models/
│       │   ├── User.js
│       │   ├── Message.js
│       │   └── LiveLocationSession.js
│       ├── routes/
│       │   ├── authRoute.js
│       │   ├── messageRoute.js
│       │   ├── locationRoute.js
│       │   └── callRoute.js
│       ├── lib/
│       │   ├── db.js              # MongoDB connection + readAt backfill trigger
│       │   ├── socket.js          # Socket.io server & online user map
│       │   ├── deliverMessage.js  # Save + socket emit helpers
│       │   ├── imagekit.js        # Media upload integration
│       │   ├── livekit.js         # LiveKit AccessToken generator & room deletion
│       │   ├── callSignaling.js   # Active calls map & Socket.io call handlers
│       │   ├── syncClerkUser.js   # Clerk ↔ MongoDB profile sync
│       │   ├── cron.js            # Production keep-alive pings
│       │   └── location/
│       │       └── parseLocation.js
│       ├── services/location/
│       │   ├── locationService.js # Static & live location business logic
│       │   └── providers/         # Map tiles (OSM), geocoding providers, Google Maps example config
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
        ├── main.jsx               # ClerkProvider + BrowserRouter entry
        ├── App.jsx                # Auth gate, socket listeners, call listeners, layout
        ├── index.css              # Cyber Luxe global styles & animations
        ├── pages/
        │   ├── ChatPage.jsx
        │   └── AuthPage.jsx
        ├── store/
        │   ├── useAuthStore.js    # authUser, socket instance, onlineUsers
        │   ├── useChatStore.js    # messages, conversations, active chat, send/receive
        │   └── useCallStore.js    # activeCall, call type, status, duration, audio/video controls
        ├── components/
        │   ├── AppLogo.jsx
        │   ├── PageLoader.jsx
        │   ├── RgbCustomizer.jsx  # RGB lighting engine settings modal
        │   ├── ThemePresetPicker.jsx
        │   ├── ThemeToggle.jsx
        │   ├── auth/              # Auth layout & sign-in panels
        │   └── chat/              # AudioCallModal, VideoCallModal, VideoFeeds, MinimizedCallBar, ChatSidebar, ChatComposer, MessageBubble, MessageList, ChannelIntel, TerminalMetadata, AvatarWithOnlineIndicator, LocationPickerModal, EmergencyLocationModal, LiveLocationGroup, ForwardMessageModal, MessageActionsMenu, ProfileEditModal, SettingsPage, etc.
        ├── context/
        │   ├── theme.js
        │   ├── ThemeContext.jsx
        │   ├── RgbContext.jsx     # RGB state (preset, speed, opacity, glow)
        │   └── WallpaperContext.jsx
        ├── hooks/                 # useLivekitCall, useCallSounds, useVoiceRecorder, useEmergencyLocationSession, useSelectedConversation, useMessageSound, useUnreadDocumentTitle, useMediaQuery, useScrollToBottom, useKeyboardSound, etc.
        ├── lib/                   # axios, callApi, locationApi, media, messages, messagePreview, imagekit, browserNotifications, utils
        ├── styles/                # cyber-luxe-glass.css, heroui-theme-presets.css
        └── data/                  # rgbPresets.js, herouiThemePresets.js, wallpapers
```

---

## Prerequisites

- **Node.js** 22+ (recommended for backend and production Docker container; 20+ works locally)
- **npm**
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Clerk** account — [dashboard.clerk.com](https://dashboard.clerk.com)
- **ImageKit** account — required for media uploads ([imagekit.io](https://imagekit.io))
- **LiveKit Cloud** account — required for WebRTC audio & video calls ([cloud.livekit.io](https://cloud.livekit.io))
- (Optional) **Nominatim** for reverse-geocoded location labels

---

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/yna_chat
FRONTEND_URL=http://localhost:5173

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# ImageKit Media Storage
IMAGEKIT_PRIVATE_KEY=private_...

# LiveKit WebRTC Audio & Video Calls (Optional for text/media; required for calls)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=API...
LIVEKIT_API_SECRET=Secret...

# Location Services (Optional)
MAP_LINK_PROVIDER=openstreetmap          # default
GEOCODING_PROVIDER=noop                  # noop | nominatim
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=YNA_Chat/1.0

# Environment Mode
NODE_ENV=development
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `CLERK_SECRET_KEY` | Yes | Clerk backend secret key |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Yes (prod) | Verifies Clerk webhook signature |
| `IMAGEKIT_PRIVATE_KEY` | Yes (media) | Required for image/video/audio attachments |
| `LIVEKIT_URL` | Yes (calls) | WebSocket URL for LiveKit Cloud or SFU server |
| `LIVEKIT_API_KEY` | Yes (calls) | LiveKit API Key for minting room tokens |
| `LIVEKIT_API_SECRET` | Yes (calls) | LiveKit API Secret for signature verification |
| `FRONTEND_URL` | Dev | CORS allowed origin for dev server |

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

In development, REST API calls are directed to `http://localhost:3000/api`. In production builds, requests use relative `/api` paths on the host origin.

---

## Local Development

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd YNA_Chat

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

- Populate `backend/.env` and `frontend/.env` using the templates above.
- In **Clerk Dashboard**:
  - Add `http://localhost:5173` as an allowed origin.
  - Set up a webhook pointing to `http://localhost:3000/api/webhooks/clerk` for `user.created`, `user.updated`, `user.deleted`.

### 3. Start Database & (Optional) Seed Users

```bash
# Start MongoDB locally or use Atlas connection string
mongod

# Seed 20 test profiles for UI testing
cd backend && npm run seed
```

### 4. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser. Verify backend health at `http://localhost:3000/health`.

---

## Database & Seeding

### Collections

| Collection | Model | Purpose |
|------------|-------|---------|
| `users` | `User` | Profile synced from Clerk (`clerkId`, `fullName`, `email`, `profilePicture`) |
| `messages` | `Message` | Chat messages, media metadata, and location pings |
| `livelocationsessions` | `LiveLocationSession` | Live location tracking session states |

---

## Authentication

YNA Chat combines **Clerk** for identity management with **MongoDB** for persistent application profiles.

1. **Webhook Sync (`POST /api/webhooks/clerk`):** Synchronizes user creation, updates, and deletions automatically.
2. **Lazy Sync (`findOrSyncUser`):** Any authenticated API call checks and syncs the MongoDB user record if missing.
3. **Protected Middleware (`protectRoute`):** Validates Clerk JWT tokens on `/api/auth/check`, `/api/messages/*`, `/api/location/*`, and `/api/calls/*`.

---

## API Reference

Base URL: `http://localhost:3000/api` (dev) or `/api` (prod). All routes (except `/health` and `/webhooks/clerk`) require `Authorization: Bearer <clerk_jwt>`.

### Health & Auth

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Server health status |
| `GET` | `/auth/check` | Returns current MongoDB user profile |

### Messages

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/messages/users` | List all users except self |
| `GET` | `/messages/conversations` | Sidebar conversations with last message & unread count |
| `GET` | `/messages/:userId` | Conversation history with user |
| `POST` | `/messages/send/:receiverId` | Send text, media, or voice message |
| `PATCH` | `/messages/read/:peerId` | Mark conversation messages as read |
| `DELETE` | `/messages/item/:messageId` | Delete user's own message |
| `POST` | `/messages/forward/:messageId` | Forward message to target user |

### Location

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/location/config` | Provider settings, tile URL, and frequency limits |
| `POST` | `/location/send/:receiverId` | Send static location pin |
| `GET` | `/location/live/active` | Retrieve active live location session |
| `POST` | `/location/live/start` | Start live location session |
| `POST` | `/location/live/:sessionId/ping` | Send live location ping |
| `POST` | `/location/live/:sessionId/stop` | End live location session |

### Audio & Video Calls (LiveKit)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/calls/invite` | Initiate voice or video call (`callType: "audio" \| "video"`), generate LiveKit room token & emit `call:incoming` |
| `POST` | `/calls/accept` | Accept incoming call & generate callee LiveKit token |
| `POST` | `/calls/reject` | Reject call & inform caller |
| `POST` | `/calls/end` | End active or ringing call & clean up room |

---

## Real-Time Events (Socket.io)

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `getOnlineUsers` | `string[]` (User IDs) | Broadcast online user list |
| `newMessage` | `Message` object | Incoming chat message |
| `messageDeleted` | `{ messageId }` | Notification of deleted message |
| `call:incoming` | `{ callId, roomName, callType, caller: { _id, fullName, profilePic } }` | Trigger incoming call modal (audio or video) |
| `call:accepted` | `{ callId, roomName }` | Callee accepted; connect caller to LiveKit room |
| `call:rejected` | `{ callId }` | Callee rejected the call |
| `call:ended` | `{ callId, roomName, reason }` | Call was ended by peer or timed out |

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `call:cancel` | — | Caller cancels ringing call |
| `call:reject` | `{ callId }` | Callee rejects incoming call |
| `call:end` | `{ callId, roomName }` | Either party ends active call |

---

## Audio & Video Calling (LiveKit & WebRTC)

1. **Invitation:** Caller selects user and clicks the voice or video call button. Frontend sends `POST /api/calls/invite` with `callType: "audio" | "video"`.
2. **Token Generation:** Express backend creates a unique room via `livekit-server-sdk` and mints a JWT token for the caller.
3. **Signaling:** Socket.io delivers `call:incoming` (with `callType`) to the target user along with synthesized ringtone.
4. **Acceptance:** Callee clicks Accept -> `POST /api/calls/accept` returns LiveKit room token for callee. Socket.io emits `call:accepted` to caller.
5. **Media Stream:** Both clients initialize `livekit-client` Room connections to `VITE_LIVEKIT_URL` and publish local audio (and camera tracks for video calls), subscribing to the peer's remote tracks.
6. **Video UI:** The callee/caller views the remote feed on a full-screen stage with a local PiP preview; camera can be toggled off/on or switched between front/rear facing modes mid-call.
7. **Call Controls:** Mute toggles the local audio track, the speaker toggle adjusts remote audio element volumes, and the call can be minimized to a floating bar with remote video preview.
8. **Defensive Cleanup:** When call ends (`POST /api/calls/end` or socket disconnect), `callSignaling` deletes room on LiveKit server and releases media hardware.

---

## Location System

- **Static Pin:** Click location icon -> pick on Leaflet map or device GPS -> sends coordinates.
- **Live Location:** Continuous background pings with configurable interval (1s - 1hr). Backend deduplicates movement under 5 meters and rate-limits rapid pings.
- **Emergency Session:** Long-press location button for automated high-frequency emergency tracking.

---

## Media Uploads

- **Storage CDN:** ImageKit (`/chat` folder).
- **Limits:** 25MB max per file; up to 10 files per message + 1 voice note.
- **Supported Formats:** JPG, PNG, GIF, WEBP, MP4, WEBM, MP3, WAV, PDF, DOCX, XLSX, TXT, etc.

---

## Frontend State & UX

- **`useAuthStore`:** Manages Clerk authentication sync, MongoDB profile, socket initialization, and online presence map.
- **`useChatStore`:** Manages active chat selection, conversation list, message timeline, replies, unread counts, and sound toggles.
- **`useCallStore`:** Manages WebRTC audio/video call state (`idle`, `outgoing`, `incoming`, `connecting`, `active`), `callType`, call timer, mute/speaker/camera toggles, camera facing mode, minimize/restore, and the LiveKit room connection (`useLivekitCall` manages track attach/detach and camera switching).

---

## UI Customization & RGB Engine

- **RGB Lighting Engine (`RgbContext` & `RgbCustomizer`):** Customizable animated RGB glowing border around the application frame. Options include color presets (Rainbow, Cyber Neon, Gold, Sunset, Matrix), animation speed slider, glow opacity, and border width.
- **HeroUI & Tailwind 4:** Deep dark/light mode integration with custom glassmorphism styles (`cyber-luxe-glass.css`).
- **Wallpapers & Themes:** Customizable background wallpapers and theme presets for chat windows.

---

## Docker Deployment

Build and run a single production monolith container:

```bash
docker build \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_... \
  --build-arg VITE_LIVEKIT_URL=wss://your-project.livekit.cloud \
  -t yna-chat .

docker run -p 3000:3000 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e CLERK_SECRET_KEY="sk_live_..." \
  -e CLERK_PUBLISHABLE_KEY="pk_live_..." \
  -e IMAGEKIT_PRIVATE_KEY="private_..." \
  -e LIVEKIT_URL="wss://..." \
  -e LIVEKIT_API_KEY="..." \
  -e LIVEKIT_API_SECRET="..." \
  -e NODE_ENV=production \
  yna-chat
```

The container listens on port `3000` (or `$PORT`), serving API endpoints at `/api/*` and the compiled React SPA static assets for all other routes.

---

## Production Notes

- **Keep-Alive Cron:** In production (`NODE_ENV=production`), `startCronJobs()` pings `/health` every 14 minutes to prevent host sleep.
- **Clerk Webhooks:** Set `CLERK_WEBHOOK_SIGNING_SECRET` and configure target URL to `https://your-domain.com/api/webhooks/clerk`.
- **LiveKit Cloud:** WebRTC media packets require UDP ports. Use LiveKit Cloud (or self-hosted LiveKit server on dedicated ports) for audio/video calls in production.

---

## Roadmap

- [x] **1:1 Real-time Text Messaging**
- [x] **Rich Media Uploads & Voice Notes**
- [x] **Static & Live Location Sharing**
- [x] **1:1 WebRTC Audio Calling (LiveKit)**
- [x] **Cyber Luxe UI & RGB Engine**
- [x] **1:1 WebRTC Video Calling** (full camera pipeline, PiP preview, camera switching)
- [ ] **Group Chats & Group Voice Channels**

---

## Scripts Reference

### Backend

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `node --watch src/server.js` | Dev server with watch mode |
| `build` | `rm -rf dist && cp -R src dist` | Production backend build |
| `start` | `node dist/server.js` | Run production server |
| `seed` | `node src/seed/userSeed.js` | Seed test user database |

### Frontend

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server |
| `build` | `vite build` | Build static production assets |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Lint codebase |

---

## License

ISC License. See individual package files for details.

---

## Summary

YNA Chat is a complete, feature-rich real-time messaging and WebRTC audio/video calling platform built with React 19, Node.js, Express 5, Socket.io, LiveKit, MongoDB, and Clerk. It features rich media sharing, editable profiles, live location tracking, a customizable RGB lighting engine, and production-ready Docker deployment options.
