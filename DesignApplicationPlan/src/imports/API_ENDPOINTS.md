# YNA Chat — API & Socket Endpoints Specification

> **Purpose of this Document**  
> This specification documents every REST HTTP API endpoint, Clerk webhook trigger, and Socket.IO real-time event in **YNA Chat**. It provides a comprehensive reference for frontend developers, backend maintainers, and UI/UX designers building client interactions.

---

## 1. Global API Architecture & Configuration

| Parameter | Configuration / Value |
|-----------|------------------------|
| **Base REST API URL** | `http://localhost:3000/api` (Production: `/api`) |
| **Authentication Scheme** | Bearer Token in `Authorization` header (`Bearer <Clerk_JWT>`) |
| **Real-time Protocol** | Socket.IO WebSockets on server root (`ws://localhost:3000`) |
| **Media Storage / CDN** | ImageKit CDN (Images, Videos, Audio, Documents, Voice Notes) |
| **Voice Call Engine** | LiveKit WebRTC Cloud / Server |
| **Default Content Type** | `application/json` (or `multipart/form-data` for media upload endpoints) |

---

## 2. REST API Endpoints Inventory

### 2.1 System & Health Routes

#### `GET /health`
- **Description**: Public health check endpoint to verify backend operational status.
- **Authentication**: None (Public).
- **Request Headers**: None.
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "YNA Chat API is running at port 3000",
    "ok": true
  }
  ```

---

### 2.2 Clerk Webhooks Route

#### `POST /api/webhooks/clerk`
- **Description**: Ingests real-time identity webhooks from Clerk to synchronize MongoDB user records (`User` collection).
- **Authentication**: Svix Signature Headers (`svix-id`, `svix-timestamp`, `svix-signature`).
- **Handled Event Types**:
  - `user.created` / `user.updated`: Upserts user email, full name, profile picture to MongoDB.
  - `user.deleted`: Removes user document from MongoDB database.
- **Success Response (`200 OK`)**:
  ```json
  {
    "received": true
  }
  ```
- **Error Response (`400 Bad Request`)**:
  ```json
  {
    "message": "Webhook verification failed"
  }
  ```

---

### 2.3 Authentication Routes (`/api/auth`)

#### `GET /api/auth/check`
- **Description**: Verifies the current user's session JWT with Clerk, syncs or retrieves their MongoDB user profile, and returns user identity data.
- **Authentication**: Required (`protectRoute` middleware).
- **Success Response (`200 OK`)**:
  ```json
  {
    "_id": "67913e2f89a1b2c3d4e5f678",
    "clerkId": "user_2sX1aBc...",
    "email": "user@example.com",
    "fullName": "Jane Doe",
    "profilePicture": "https://img.clerk.com/...",
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-22T14:30:00.000Z"
  }
  ```
- **Error Response (`401 Unauthorized`)**:
  ```json
  {
    "message": "Unauthorized"
  }
  ```

---

### 2.4 Messaging Routes (`/api/messages`)

#### `GET /api/messages/users`
- **Description**: Fetches all registered users in the network (excluding the currently authenticated user) for the sidebar "Users" tab.
- **Authentication**: Required.
- **Success Response (`200 OK`)**:
  ```json
  [
    {
      "_id": "67914a1b89a1b2c3d4e5f679",
      "email": "alex@example.com",
      "fullName": "Alex Rivera",
      "profilePicture": "https://img.clerk.com/...",
      "createdAt": "2026-01-21T09:15:00.000Z"
    }
  ]
  ```

---

#### `GET /api/messages/conversations`
- **Description**: Fetches all active 1:1 conversation threads for the authenticated user, aggregated with last message details and unread message counters.
- **Authentication**: Required.
- **Success Response (`200 OK`)**:
  ```json
  [
    {
      "_id": "67914a1b89a1b2c3d4e5f679",
      "fullName": "Alex Rivera",
      "profilePic": "https://img.clerk.com/...",
      "email": "alex@example.com",
      "unreadCount": 3,
      "lastMessage": {
        "_id": "67923f1b89a1b2c3d4e5f999",
        "senderId": "67914a1b89a1b2c3d4e5f679",
        "receiverId": "67913e2f89a1b2c3d4e5f678",
        "text": "Hey, let's meet up!",
        "image": [],
        "video": [],
        "voice": [],
        "audio": [],
        "document": [],
        "location": null,
        "createdAt": "2026-07-22T23:00:00.000Z"
      }
    }
  ]
  ```

---

#### `GET /api/messages/:id`
- **Description**: Fetches all chat history messages exchanged between the logged-in user and the specified peer (`:id`). Automatically marks unread peer messages as read.
- **Authentication**: Required.
- **Path Parameter**: `:id` (Peer MongoDB User `_id`).
- **Success Response (`200 OK`)**:
  ```json
  [
    {
      "_id": "67923f1b89a1b2c3d4e5f999",
      "senderId": "67914a1b89a1b2c3d4e5f679",
      "receiverId": "67913e2f89a1b2c3d4e5f678",
      "text": "Check out this document",
      "image": ["https://ik.imagekit.io/.../photo.jpg"],
      "video": [],
      "voice": [],
      "audio": [],
      "document": ["https://ik.imagekit.io/.../report.pdf"],
      "replyTo": null,
      "readAt": "2026-07-22T23:05:00.000Z",
      "createdAt": "2026-07-22T23:00:00.000Z"
    }
  ]
  ```

---

#### `POST /api/messages/send/:id`
- **Description**: Sends a message to peer (`:id`). Supports text, quoted reply, media uploads (images, videos, audio, documents up to 10 files via ImageKit), or 1 voice note file.
- **Authentication**: Required.
- **Path Parameter**: `:id` (Recipient User `_id`).
- **Content-Type**: `multipart/form-data` or `application/json`.
- **Form Fields**:
  - `text` (string, optional): Message text content.
  - `media` (files, optional): Up to 10 files (images, videos, audio, office docs).
  - `voice` (file, optional): Up to 1 voice memo audio file.
  - `replyTo` (JSON object / string, optional): Quoted reply payload `{ messageId, text, senderName }`.
- **Success Response (`201 Created`)**:
  ```json
  {
    "_id": "6792500089a1b2c3d4e5f001",
    "senderId": "67913e2f89a1b2c3d4e5f678",
    "receiverId": "67914a1b89a1b2c3d4e5f679",
    "text": "Sounds good!",
    "image": ["https://ik.imagekit.io/.../img.png"],
    "video": [],
    "voice": [],
    "audio": [],
    "document": [],
    "replyTo": {
      "messageId": "67923f1b89a1b2c3d4e5f999",
      "text": "Hey, let's meet up!",
      "senderName": "Alex Rivera"
    },
    "createdAt": "2026-07-22T23:10:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Message cannot be empty or invalid recipient.
  - `500 Internal Server Error`: Media upload failed or CDN unconfigured.

---

#### `POST /api/messages/forward/:messageId`
- **Description**: Forwards an existing message (`:messageId`) to a target user.
- **Authentication**: Required.
- **Path Parameter**: `:messageId` (Target message `_id`).
- **Request Body**:
  ```json
  {
    "receiverId": "67914a1b89a1b2c3d4e5f679"
  }
  ```
- **Success Response (`201 Created`)**: Returns newly created forwarded `Message` object.
- **Error Response (`403 Forbidden`)**: "You cannot forward this message".

---

#### `PATCH /api/messages/read/:id`
- **Description**: Explicitly marks all unread messages received from peer (`:id`) as read.
- **Authentication**: Required.
- **Path Parameter**: `:id` (Peer User `_id`).
- **Success Response (`200 OK`)**:
  ```json
  {
    "ok": true,
    "modifiedCount": 4
  }
  ```

---

#### `DELETE /api/messages/item/:messageId`
- **Description**: Deletes a message sent by the current user. Triggers a real-time `messageDeleted` WebSocket event to the peer.
- **Authentication**: Required.
- **Path Parameter**: `:messageId` (Target Message `_id`).
- **Success Response (`200 OK`)**:
  ```json
  {
    "ok": true,
    "messageId": "6792500089a1b2c3d4e5f001"
  }
  ```
- **Error Response (`403 Forbidden`)**: "You can only delete your own messages".

---

### 2.5 Location Services Routes (`/api/location`)

#### `GET /api/location/config`
- **Description**: Returns configuration settings for static and live location services.
- **Authentication**: Required.
- **Success Response (`200 OK`)**:
  ```json
  {
    "reverseGeocodingEnabled": true,
    "defaultIntervalMs": 30000,
    "minIntervalMs": 1000,
    "maxIntervalMs": 3600000
  }
  ```

---

#### `POST /api/location/send/:id`
- **Description**: Sends a static map location pin message to peer (`:id`) with address geocoding.
- **Authentication**: Required.
- **Path Parameter**: `:id` (Recipient User `_id`).
- **Request Body**:
  ```json
  {
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "label": "Financial District, New York, NY"
    }
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "message": {
      "_id": "6792600089a1b2c3d4e5f002",
      "senderId": "67913e2f89a1b2c3d4e5f678",
      "receiverId": "67914a1b89a1b2c3d4e5f679",
      "location": {
        "lat": 40.7128,
        "lng": -74.0060,
        "label": "Financial District, New York, NY"
      },
      "createdAt": "2026-07-22T23:15:00.000Z"
    }
  }
  ```

---

#### `GET /api/location/live/active`
- **Description**: Retrieves the active emergency live location tracking session for the current user (if any).
- **Authentication**: Required.
- **Success Response (`200 OK`)**:
  ```json
  {
    "session": {
      "sessionId": "live_session_12345",
      "senderId": "67913e2f89a1b2c3d4e5f678",
      "receiverId": "67914a1b89a1b2c3d4e5f679",
      "intervalMs": 5000,
      "updateCount": 12,
      "isActive": true,
      "createdAt": "2026-07-22T23:10:00.000Z"
    }
  }
  ```

---

#### `POST /api/location/live/start`
- **Description**: Starts a new emergency live location tracking session with a peer.
- **Authentication**: Required.
- **Request Body**:
  ```json
  {
    "receiverId": "67914a1b89a1b2c3d4e5f679",
    "intervalMs": 5000
  }
  ```
- **Success Response (`201 Created`)**: Returns live location session object.

---

#### `POST /api/location/live/:sessionId/ping`
- **Description**: Sends a periodic GPS location update during an active live session (`:sessionId`).
- **Authentication**: Required.
- **Path Parameter**: `:sessionId` (Active Live Session ID).
- **Request Body**:
  ```json
  {
    "location": {
      "lat": 40.7130,
      "lng": -74.0062
    },
    "force": false
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "message": { ... },
    "session": { ... },
    "location": { "lat": 40.7130, "lng": -74.0062 }
  }
  ```

---

#### `POST /api/location/live/:sessionId/stop`
- **Description**: Stops an active emergency live location sharing session.
- **Authentication**: Required.
- **Path Parameter**: `:sessionId` (Target Session ID).
- **Request Body**:
  ```json
  {
    "sendEndMessage": true
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "session": { "isActive": false },
    "endMessage": { "text": "Live location sharing ended" }
  }
  ```

---

### 2.6 Voice Calling WebRTC Routes (`/api/calls`)

#### `POST /api/calls/invite`
- **Description**: Initiates a 1:1 LiveKit WebRTC audio call with peer. Creates LiveKit room and sends `call:incoming` socket signal to callee.
- **Authentication**: Required.
- **Request Body**:
  ```json
  {
    "peerId": "67914a1b89a1b2c3d4e5f679"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "callId": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
    "roomName": "call-f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses**:
  - `409 Conflict`: User is already in a call or peer is offline.
  - `503 Service Unavailable`: LiveKit voice calling unconfigured.

---

#### `POST /api/calls/accept`
- **Description**: Accepts an incoming call invitation. Mints a LiveKit room token for the callee and emits `call:accepted` to caller.
- **Authentication**: Required.
- **Request Body**:
  ```json
  {
    "callId": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "roomName": "call-f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

#### `POST /api/calls/reject`
- **Description**: Rejects an incoming call invitation. Emits `call:rejected` to caller.
- **Authentication**: Required.
- **Request Body**:
  ```json
  {
    "callId": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Call rejected"
  }
  ```

---

#### `POST /api/calls/end`
- **Description**: Ends an ongoing call or cancels a ringing call. Deletes the LiveKit room and emits `call:ended` to peer.
- **Authentication**: Required.
- **Request Body**:
  ```json
  {
    "callId": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
    "roomName": "call-f47ac10b-58cc-4372-a567-0e02b2c3d4e5"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Call ended"
  }
  ```

---

## 3. Socket.IO Real-Time WebSockets Specification

### Connection & Authentication Handshake
Clients connect to Socket.IO using the Clerk session token in the handshake authentication payload:
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: await getToken(),
  },
});
```

---

### 3.1 Server-to-Client Events (Emitted by Backend)

| Event Name | Trigger Condition | Payload Structure | Frontend Handler Action |
|------------|-------------------|-------------------|-------------------------|
| `getOnlineUsers` | User connects or disconnects | `Array<string>` (User IDs e.g. `["id1", "id2"]`) | Updates real-time online status indicators on avatars & chat headers. |
| `newMessage` | New message sent to user | `Object` (Full `Message` document) | Appends message to chat stream, updates sidebar preview & unread badge count, plays sound. |
| `messageDeleted` | Peer deletes a message | `{ messageId, senderId, receiverId }` | Removes message from local store and chat view instantly. |
| `call:incoming` | Peer invites user to voice call | `{ callId, roomName, caller: { _id, fullName, profilePic } }` | Displays `AudioCallModal` with ringtone for incoming call. |
| `call:accepted` | Callee accepts call invitation | `{ callId, roomName }` | Connects caller to LiveKit audio room stream. |
| `call:rejected` | Callee rejects call invitation | `{ callId }` | Stops ringing sound, displays "Call Rejected" toast. |
| `call:ended` | Peer ends call or disconnects | `{ callId, roomName, reason }` | Disconnects LiveKit audio room, closes call modal overlay. |

---

### 3.2 Client-to-Server Events (Emitted by Frontend)

| Event Name | Trigger Condition | Payload Structure | Server Response Action |
|------------|-------------------|-------------------|------------------------|
| `call:cancel` | Caller cancels ringing call before peer answers | None | Cleans up call room, emits `call:ended` (`reason: "cancelled"`) to callee. |
| `call:reject` | Callee taps "Reject" button | `{ callId }` | Emits `call:rejected` to caller, destroys call room. |
| `call:end` | Either participant taps "End Call" | `{ callId, roomName }` | Emits `call:ended` to peer, deletes LiveKit room. |

---

## 4. Endpoints Summary Reference Table

| Protocol | Method / Event | Endpoint / Event Name | Authentication | Brief Purpose |
|----------|----------------|-----------------------|----------------|---------------|
| **HTTP** | `GET` | `/health` | None | API health status |
| **HTTP** | `POST` | `/api/webhooks/clerk` | Svix Signature | Sync Clerk user events to MongoDB |
| **HTTP** | `GET` | `/api/auth/check` | Bearer Token | Verify JWT & get current user profile |
| **HTTP** | `GET` | `/api/messages/users` | Bearer Token | Fetch all registered users for sidebar |
| **HTTP** | `GET` | `/api/messages/conversations` | Bearer Token | Fetch sidebar conversations with previews & unread counts |
| **HTTP** | `GET` | `/api/messages/:id` | Bearer Token | Fetch chat history with peer & mark read |
| **HTTP** | `POST` | `/api/messages/send/:id` | Bearer Token | Send text, multi-media, voice note, reply |
| **HTTP** | `POST` | `/api/messages/forward/:messageId` | Bearer Token | Forward message to target user |
| **HTTP** | `PATCH` | `/api/messages/read/:id` | Bearer Token | Mark conversation as read |
| **HTTP** | `DELETE` | `/api/messages/item/:messageId` | Bearer Token | Delete message for both users |
| **HTTP** | `GET` | `/api/location/config` | Bearer Token | Fetch location service configuration |
| **HTTP** | `POST` | `/api/location/send/:id` | Bearer Token | Send static map pin location |
| **HTTP** | `GET` | `/api/location/live/active` | Bearer Token | Get active emergency live tracking session |
| **HTTP** | `POST` | `/api/location/live/start` | Bearer Token | Start live location tracking session |
| **HTTP** | `POST` | `/api/location/live/:sessionId/ping` | Bearer Token | Send GPS location update ping |
| **HTTP** | `POST` | `/api/location/live/:sessionId/stop` | Bearer Token | Stop live location tracking session |
| **HTTP** | `POST` | `/api/calls/invite` | Bearer Token | Initiate WebRTC voice call room |
| **HTTP** | `POST` | `/api/calls/accept` | Bearer Token | Accept incoming voice call |
| **HTTP** | `POST` | `/api/calls/reject` | Bearer Token | Reject incoming voice call |
| **HTTP** | `POST` | `/api/calls/end` | Bearer Token | End active voice call |
| **Socket** | `IN` / `OUT` | `getOnlineUsers` | Socket Auth Token | Sync online users array |
| **Socket** | `OUT` | `newMessage` | Socket Auth Token | Real-time message delivery |
| **Socket** | `OUT` | `messageDeleted` | Socket Auth Token | Real-time message deletion sync |
| **Socket** | `OUT` | `call:incoming` | Socket Auth Token | Incoming call notification signal |
| **Socket** | `OUT` | `call:accepted` | Socket Auth Token | Call acceptance signal |
| **Socket** | `OUT` | `call:rejected` | Socket Auth Token | Call rejection signal |
| **Socket** | `OUT` | `call:ended` | Socket Auth Token | Call termination signal |
| **Socket** | `IN` | `call:cancel` | Socket Auth Token | Cancel outgoing ringing call |
| **Socket** | `IN` | `call:reject` | Socket Auth Token | Reject incoming call |
| **Socket** | `IN` | `call:end` | Socket Auth Token | Terminate active call |

---

*Document version: 1.0 — Generated for YNA Chat API Specifications.*  
*File Path: `d:\Programming\MyProjecs\YNA_Chat\docs\API_ENDPOINTS.md`*
