# YNA Chat — Pages & Feature Specifications for UI/UX Redesign

> **Purpose of this Document**  
> This specification document provides a complete, screen-by-screen breakdown of all pages, sub-views, panels, modals, overlays, and features in **YNA Chat**. It serves as an exhaustive blueprint for UI/UX designers to understand the full functional footprint of the application before undertaking a visual and structural redesign.

---

## 1. Information Architecture & App Structure

**YNA Chat** is built as a single-page application (SPA) featuring **2 primary routes**, **1 persistent responsive shell**, **3 layout panels**, and **6 interactive modal overlays**.

### High-Level Page & Feature Map

```
YNA Chat Application Shell
├── 🔴 Route 1: Auth Page (/auth) [Signed-out users]
│   ├── Auth Header (Logo, Theme / RGB / Sound Toggles)
│   ├── Auth Hero Panel (Branding, Mesh Grid Animation, Value Proposition)
│   └── Auth Action Panel (Frosted Glass Card, Clerk OAuth & Credentials Trigger)
│
├── 🟢 Route 2: Main Chat Application Page (/) [Signed-in users]
│   ├── Responsive Shell & Outer RGB Glow Frame
│   │
│   ├── 📱 Pane 1: Left Navigation & Contacts Sidebar (ChatSidebar)
│   │   ├── Brand Header & Clerk Profile UserButton
│   │   ├── Real-time Search Input
│   │   ├── Navigation Tabs ("Chats" | "Users")
│   │   ├── Conversation / User Rows (Avatars, Online Dot, Preview, Unread Counter)
│   │   └── Sidebar Footer & Settings Dropdown
│   │
│   ├── 💬 Pane 2: Central Chat Workspace (Main Chat Panel)
│   │   ├── Chat Header (Peer Avatar, Online Status, Call Status, Action Toolbar)
│   │   ├── Message Stream List (Scroll View, Date Dividers, Multi-format Bubbles, Actions Menu)
│   │   └── Chat Composer (Reply Banner, Live Location Banner, Multi-media Uploads, Voice Memo, Map Pin, Text Input)
│   │
│   ├── 📊 Pane 3: Channel Intel Panel (ChannelIntel - XL screens ≥ 1280px)
│   │   ├── Encryption Security Card
│   │   ├── Peer Reputation Badge
│   │   └── Shared Media Thumbnail Gallery
│   │
│   └── 🌌 Workspace Empty State (NoConversationPlaceholder)
│       └── Floating Glow Orb & Setup Guidance
│
└── 🪟 Global Modals & Overlays (Accessible across views)
    ├── RGB Glow Customizer Modal (RgbCustomizer)
    ├── Accent Theme Preset Picker Modal (ThemePresetPicker)
    ├── Static Map Location Picker Modal (LocationPickerModal)
    ├── Emergency Live Location Tracker Modal (EmergencyLocationModal)
    ├── Forward Message Contact Selector Modal (ForwardMessageModal)
    ├── WebRTC 1:1 Voice Call Overlay (AudioCallModal)
    └── Global Toast Notifications & Full-Screen Loader
```

---

## 2. Page 1: Authentication Page (`/auth`)

### Overview
The Authentication Page is the entry point for signed-out users. It introduces the user to the visual identity of YNA Chat—featuring an outer animated RGB glowing border, dark glass surfaces, and futuristic brand elements—while providing access to authentication via Clerk.

```
┌─────────────────────────────────────────────────────────┐
│ [RGB Animated Border Frame + Ambient Outer Glow]       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Auth Header: Logo · YNA Chat · RGB ✨ · Theme 🎨 · 🌙 │ │
│ ├──────────────────────────┬──────────────────────────┤ │
│ │ Auth Hero Panel (Left)   │ Auth Action Panel (Right)│ │
│ │ • Cyber Mesh Grid Anim   │ • Glass Shell Card       │ │
│ │ • Headline & Tagline     │ • Logo Tile with Glow    │ │
│ │ • 3D Cyber Graphic       │ • "Continue" (Clerk)     │ │
│ │ • Security Badges        │ • Protocol Specs Footer  │ │
│ └──────────────────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Components & Features Inventory

| Component File | UI Surface | Detailed Features & Interactions |
|----------------|------------|-----------------------------------|
| [AuthPage.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/pages/AuthPage.jsx) | Page Shell | Encloses screen in `.rgb-border-glow` continuous rotating gradient border with optional blurred ambient halo. |
| [AuthHeader.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/auth/AuthHeader.jsx) | Top Navigation Header | • **App Logo & Title**: Displays glowing YNA logo tile and shimmer title text.<br>• **RGB Glow Button**: Opens `RgbCustomizer` modal.<br>• **Theme Accent Button**: Opens `ThemePresetPicker` modal.<br>• **Light/Dark Toggle**: Switches base color scheme. |
| [AuthHeroPanel.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/auth/AuthHeroPanel.jsx) & [AuthHeroPattern.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/auth/AuthHeroPattern.jsx) | Left Hero Section | • **Cyber Grid Overlay**: Animated SVG mesh background with glowing nodes.<br>• **Status Tag**: "Protocol 4.2 Active" badge.<br>• **Headline Copy**: "Next-Gen Secure Neural Messaging".<br>• **Floating Illustration**: 3D floating graphic illustration.<br>• **Security Badges**: "End-to-End Encrypted", "Zero-Knowledge Sync", "Ultra-Low Latency Voice". |
| [AuthActionPanel.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/auth/AuthActionPanel.jsx) & [AuthCardShell.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/auth/AuthCardShell.jsx) | Right Auth Card | • **Frosted Glass Card**: Deep dark glass container.<br>• **Sign-in Trigger Button**: "Continue to YNA Chat" primary action button that launches the modal sign-in flow (Email/Password, Google OAuth, etc.).<br>• **Security Footer**: "256-bit AES-GCM · TLS 1.3 Strict" security specs label. |

### Responsive Behavior
- **Desktop (≥ 768px)**: Split-panel 2-column layout (Hero on left, Auth card on right).
- **Mobile (< 768px)**: Vertically stacked single-column view with scrollable container.

---

## 3. Page 2: Main Chat Application Page (`/`)

### Overview
The Main Chat Page is the primary workspace for authenticated users. It contains a 2-to-3 pane layout surrounded by the signature RGB animated border frame, supporting real-time messaging, multi-format media attachments, voice memos, map pin drop, live location stream tracking, 1:1 audio calls, and custom theme presets.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [RGB Animated Border Frame + Ambient Outer Glow]                                       │
│ ┌──────────────────┬───────────────────────────────────────────┬─────────────────────┐ │
│ │ SIDEBAR (Pane 1) │ MAIN CHAT PANEL (Pane 2)                  │ INTEL PANEL (Pane 3)│ │
│ │ • Logo & Profile │ • Header: Peer info, Call button, Toolbar │ (Desktop XL ≥1280px)│ │
│ │ • Search Stream  │ • Message Feed: Date lines, Bubbles       │ • Security Intel    │ │
│ │ • Tabs: Chats/Users│ • Composer: Reply, Media, Voice, Map Pin  │ • Peer Reputation   │ │
│ │ • Contacts List  ├───────────────────────────────────────────┤ • Shared Media      │ │
│ │ • Status Footer  │ Empty State (if no conversation selected) │   Gallery           │ │
│ └──────────────────┴───────────────────────────────────────────┴─────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.1 Sidebar Navigation Pane (`ChatSidebar.jsx`)

The left sidebar manages user profile settings, real-time filtering, conversation history, and user directory selection.

| Feature Section | Element / Control | Functional Description |
|-----------------|-------------------|------------------------|
| **Sidebar Header** | Logo & Title | Displays application logo, shimmer brand title, and active protocol badge. |
| | Clerk `UserButton` | Profile menu popup allowing users to edit profile image/name, view session security, or sign out. |
| **Search Bar** | Real-time Search Input | Input field with search icon that filters conversations or registered users in real time. |
| **Navigation Tabs** | "Chats" Tab | Displays all existing 1:1 conversation threads ordered by recent message activity. |
| | "Users" Tab | Displays all registered accounts in the system to initiate new conversations. |
| **Conversation Row** ([ConversationRow.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/chat/ConversationRow.jsx)) | Peer Avatar & Presence | User avatar with a green dot for Online users or a muted dot for Offline users. |
| | User Information | Peer full name, last message preview text snippet (with media icons), and formatted timestamp. |
| | Unread Counter Pill | Glowing accent pill displaying unread message count (e.g., "3", capped at "99+"). |
| | Active Highlight | Selected state featuring accent glow border and background tint. |
| **Sidebar Footer** | System Status Badge | "System: Secure" status indicator with green pulse light. |
| | Settings Dropdown ([SidebarSettingsMenu.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/chat/SidebarSettingsMenu.jsx)) | Gear icon opening quick controls menu (RGB glow, Accent theme, Theme toggle, Sound effects). |

---

### 3.2 Main Chat Workspace Panel (`cyber-main-panel`)

The central pane handles active conversation streams, incoming/outgoing messaging, voice notes, media views, location pin drops, and call controls.

#### A. Chat Header (`ChatHeader.jsx`)

| Element | Description | User Actions & Triggers |
|---------|-------------|-------------------------|
| **Mobile Back Button** | Chevron Left icon | Visible on screens `< lg`. Tap returns from chat panel back to conversation list. |
| **Peer Avatar & Online Dot** | Avatar with online badge | Displays peer profile photo, initials fallback, and green/muted presence indicator. |
| **Peer Info Title & Subtitle** | Name + Presence text | Displays peer full name and "Online" (green) or "Offline" (muted) status. |
| **Call Status Chip** | Dynamic status badge | Displays live call state chip (`Ringing`, `Incoming`, `Connecting`, `In Call`) during active call. |
| **Video Call Button** | Camera icon | Disabled button with "Video calls coming soon" tooltip. |
| **Voice Call Button** | Phone icon | Triggers WebRTC 1:1 voice call via LiveKit. Active only when peer is online. |
| **Header Overflow Menu** ([ChatHeaderMenu.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/chat/ChatHeaderMenu.jsx)) | Vertical More (⋮) icon | Dropdown menu providing quick access to:<br>• **RGB Customizer** (Sparkles ✨)<br>• **Theme Accent Picker** (Palette 🎨)<br>• **Light/Dark Toggle** (Sun/Moon)<br>• **Notification Sounds** (ON/OFF)<br>• **Keyboard Typing Sounds** (ON/OFF) |

---

#### B. Message Stream Feed (`MessageList.jsx` & `MessageBubble.jsx`)

| Feature | Visual & Functional Details |
|---------|-----------------------------|
| **Auto-scroll Stream** | Smooth scroll container that automatically scrolls to the newest incoming message. |
| **Date Dividers** | Center-aligned uppercase date chips ("TODAY", formatted date) with gradient dividing lines. |
| **Own Message Bubble** | Right-aligned, colored with active accent theme gradient, inner top highlight, drop shadow. |
| **Peer Message Bubble** | Left-aligned, frosted dark glass bubble with thin white/muted outline. |
| **Text Messages** | Multi-line text support, auto-detected clickable URLs, custom font rendering. |
| **Reply Preview Banner** | Embedded quote card above text showing author name and preview of replied-to message. |
| **Image Attachments** | Single photo preview or photo grid with ImageKit CDN optimizations. |
| **Video Player** ([MessageVideo.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/chat/MessageVideo.jsx)) | Embedded HTML5 video container with play/pause and fullscreen controls. |
| **Voice Memo Player** ([MessageVoice.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/chat/MessageVoice.jsx)) | Custom voice note player with play/pause button, waveform representation track, and duration readout. |
| **Document Files** ([MessageDocument.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/chat/MessageDocument.jsx)) | Document attachment card showing file type icon (PDF, DOCX, XLSX, TXT, RTF), file name, size, and download button. |
| **Static Location Pin** ([MessageLocation.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/chat/MessageLocation.jsx)) | Interactive static map card with Leaflet map thumbnail, latitude/longitude coordinates, and "View on Google Maps" external link. |
| **Live Location Group** ([LiveLocationGroup.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/chat/LiveLocationGroup.jsx)) | Consolidated stream of emergency/live GPS location updates with live elapsed timer, update counter, and status indicator. |
| **Message Actions Context Menu** ([MessageActionsMenu.jsx](file:///d:/Programming/MyProjecs/YNA_Chat/frontend/src/components/chat/MessageActionsMenu.jsx)) | Menu on hover / trigger offering:<br>• **Reply**: Mounts reply preview bar to composer.<br>• **Forward**: Opens `ForwardMessageModal`.<br>• **Delete**: Removes message for both users. |

---

#### C. Chat Composer Bar (`ChatComposer.jsx`)

| Control / Banner | Trigger | Functional Description |
|------------------|---------|------------------------|
| **Reply Context Banner** | Replying to message | Displays quoted parent message preview banner with a Close (✕) button to cancel reply state. |
| **Live Location Active Banner** | Active emergency location session | Pulsing red dot indicator, elapsed duration timer, ping counter, and "Stop Sharing" button. |
| **Uploading Media Banner** | Sending attachments | Progress bar banner displaying active file upload state to CDN. |
| **Attachment Button** | Paperclip / Image icon | Opens native OS file picker. Supports up to 10 files (max 25MB each) across images, videos, audio, and documents. |
| **Location Button** | MapPin icon | • **Single Click**: Opens static map `LocationPickerModal`.<br>• **Long Press (≥ 500ms)**: Opens `EmergencyLocationModal` for live tracking setup. |
| **Voice Memo Button** | Mic icon (when text empty) | • **Tap to Record**: Starts voice recording bar.<br>• **Recording Bar UI**: Pulsing red dot, timer counter, Cancel button, Stop button.<br>• **Preview Bar UI**: Playback preview, duration readout, Send button, Discard button. |
| **Text Area Input** | Multi-line input | Auto-expanding text input field. Enter sends message; Shift+Enter creates a newline. Triggers typing sound FX if enabled. |
| **Send Action Button** | Paperplane icon | Submits text/media payload with glowing accent hover effects. |

---

### 3.3 Channel Intel Panel (`ChannelIntel.jsx`)

*Visible on Desktop XL screens (≥ 1280px wide) when a conversation is active.*

| Intel Card | Visual Components & Contents |
|------------|------------------------------|
| **Header** | "Channel Intel" sidebar title. |
| **Encryption Security Card** | "Encryption: End-to-End Quantum" label with 92% security progress indicator bar. |
| **Peer Reputation Card** | "Peer Reputation: Elite Operative" status with gold star icon badge. |
| **Shared Media Gallery** | Thumbnail grid displaying up to 3 recently shared images in the chat plus an overflow counter badge (`+N`). |

---

### 3.4 Workspace Empty State (`NoConversationPlaceholder.jsx`)

*Displayed in the main workspace panel when no conversation thread is selected.*

- **Visual Element**: Floating, ambient-glowing neon orb graphic.
- **Copy**: "Select a conversation to start messaging".

---

## 4. Global Modals, Overlays & Dialogs

YNA Chat includes 6 dedicated modal overlays that can be triggered across screens.

### 4.1 RGB Glow Customizer Modal (`RgbCustomizer.jsx`)
Triggered via the **Sparkles (✨) icon** in the top header or settings menus.

```
┌────────────────────────────────────────────────────────┐
│ RGB Frame Customizer                                 ✕ │
├────────────────────────────────────────────────────────┤
│ GLOW PRESET                                            │
│ [Rainbow Flow] [Cyberpunk] [Cosmic Aurora]             │
│ [Volcanic Fire] [Matrix Neon] [Electric Violet]        │
│                                                        │
│ ANIMATION SPEED                                        │
│ [Slow - 12s]  [Medium - 6s]  [Fast - 3s]               │
│                                                        │
│ AMBIENT GLOW INTENSITY                                 │
│ [Off]  [Low - 16px]  [Medium - 24px]  [High - 36px]    │
└────────────────────────────────────────────────────────┘
```

| Setting Category | Options & Specifications |
|------------------|--------------------------|
| **Glow Preset (6 Options)** | • `Rainbow Flow`: Full spectrum gradient.<br>• `Cyberpunk`: Hot pink, purple, cyan.<br>• `Cosmic Aurora`: Emerald green, cyan, indigo, purple.<br>• `Volcanic Fire`: Deep red, orange, amber.<br>• `Matrix Neon`: Matrix green, dark green.<br>• `Electric Violet`: Violet, lavender, magenta. |
| **Animation Speed (3 Options)** | • `Slow`: 12 seconds per 360° rotation.<br>• `Medium`: 6 seconds per 360° rotation (Default).<br>• `Fast`: 3 seconds per 360° rotation. |
| **Ambient Glow Intensity (4 Options)** | • `Off`: 0px blur, 0 opacity (Border ring only).<br>• `Low`: 16px blur halo, 0.30 opacity.<br>• `Medium`: 24px blur halo, 0.55 opacity (Default).<br>• `High`: 36px blur halo, 0.85 opacity. |

---

### 4.2 Accent Theme Preset Picker Modal (`ThemePresetPicker.jsx`)
Triggered via the **Palette (🎨) icon** in top header or settings menus.

- **Purpose**: Controls the inner UI accent colors (buttons, own message bubbles, focus rings, active tab indicators).
- **11 Brand Presets**:
  1. `Default` (Cyber Turquoise / Neon Blue)
  2. `Sky` (Deep Azure)
  3. `Lavender` (Soft Purple)
  4. `Mint` (Emerald Green)
  5. `Netflix` (Bright Crimson)
  6. `Uber` (Dark Monochrome)
  7. `Spotify` (Vibrant Green)
  8. `Coinbase` (Electric Blue)
  9. `Airbnb` (Coral Pink)
  10. `Discord` (Blurple)
  11. `Rabbit` (Vibrant Orange)

---

### 4.3 Static Location Picker Modal (`LocationPickerModal.jsx`)
Triggered via **single tap on MapPin icon** in ChatComposer.

- **Interactive Map**: OpenStreetMap rendering via Leaflet map engine.
- **GPS Auto-Locate Button**: "Use My Current Location" button using browser Geolocation API.
- **Draggable Marker**: Drag marker pin anywhere on map to select precise coordinates.
- **Address Label Box**: Displays geocoded location address string.
- **Action Button**: "Confirm & Send Location" submits static location card to chat.

---

### 4.4 Emergency Live Location Modal (`EmergencyLocationModal.jsx`)
Triggered via **long-press (≥ 500ms) on MapPin icon** in ChatComposer.

- **Interval Presets**: `1 second` (Ultra-fast), `5 seconds` (High frequency), `30 seconds` (Standard), `1 minute` (Energy saver), `5 minutes`, `1 hour`.
- **Custom Interval**: Allows user-defined numerical value + time unit selector.
- **Action Button**: "Start Sharing Live Location" launches automated GPS streaming loop.
- **Active State UI**: Displays active stream timer, ping update counter, and "Stop Sharing" button.

---

### 4.5 Forward Message Modal (`ForwardMessageModal.jsx`)
Triggered via **Message Context Menu → Forward**.

- **User Directory Picker**: Filterable list of all registered contacts.
- **Action**: Single tap on target contact immediately forwards message copy.

---

### 4.6 WebRTC 1:1 Audio Call Overlay (`AudioCallModal.jsx`)
Triggered via **Phone icon** in ChatHeader or incoming Socket call signal.

```
┌────────────────────────────────────────────────────────┐
│                   AUDIO CALL OVERLAY                   │
│                                                        │
│                     ( User Avatar )                    │
│                        Alex Rivera                     │
│                    [ In Call • 03:42 ]                 │
│                                                        │
│           [ 🎤 Mute ]    [ 🔊 Speaker ]    [ 📞 End ]  │
└────────────────────────────────────────────────────────┘
```

| Call State | Visual Layout & Controls |
|------------|--------------------------|
| **Incoming Call** | Peer Avatar, Peer Name, ringing sound, Green "Accept" button, Red "Reject" button. |
| **Outgoing Call** | Peer Avatar, Peer Name, ringback sound, "Ringing...", Red "Cancel" button. |
| **Active Call** | Live duration timer (e.g. `04:15`), Peer avatar, Mute/Unmute microphone toggle button, Red "End Call" button. |
| **Connecting State** | Loading indicator with "Connecting to encrypted stream...". |

---

## 5. Summary Table for UI/UX Designers

| Page / Component | Key UI Elements | Primary UX Goal |
|------------------|-----------------|-----------------|
| **Auth Page (`/auth`)** | RGB Border, Hero Graphic, Clerk Auth Card | Deliver high-tech brand identity and seamless sign-in. |
| **Chat Sidebar** | Search bar, Tabs (Chats/Users), Avatars, Badges, UserButton | Provide effortless channel switching & search. |
| **Main Chat Workspace** | Header with call actions, Message list, Composer | Maximize readability and message creation efficiency. |
| **Message Bubbles** | Text, Images, Video, Audio, Docs, Map Pin, Live GPS | Support rich multi-format communication cleanly. |
| **Chat Composer** | File picker, MapPin (Tap/Long press), Mic (Record/Preview) | Keep complex attachment options intuitively accessible. |
| **Channel Intel Panel** | Security rating, Reputation badge, Shared Media | Provide quick context and media history on large screens. |
| **RGB Customizer Modal** | 6 Presets, 3 Speeds, 4 Ambient Intensities | Give users flagship visual frame personalization. |
| **Theme Preset Picker** | 11 Color swatches | Allow personal accent color customization. |
| **Location Modals** | Leaflet Map, GPS locate button, Live tracking interval | Enable seamless static pin drops & emergency tracking. |
| **Voice Call Overlay** | Avatar, Timer, Mute button, End call button | Deliver clear, uncluttered audio call interface. |

---

*Document version: 1.0 — Created for YNA Chat UI/UX Redesign Blueprint.*  
*File Path: `d:\Programming\MyProjecs\YNA_Chat\docs\PAGES_AND_FEATURES.md`*
