# YNA Chat — UI/UX Design Brief

> **Purpose of this document**  
> This brief gives a UI/UX designer everything needed to understand YNA Chat: what the product does, every user-facing feature, the current visual direction (especially the **RGB Glow** system), and the design goals we are aiming for. Use it as the source of truth when redesigning the app for a more modern, user-friendly experience.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Users & Core Use Cases](#2-target-users--core-use-cases)
3. [Application Screens & Navigation](#3-application-screens--navigation)
4. [Feature Inventory](#4-feature-inventory)
5. [RGB Glow Feature (Flagship Customization)](#5-rgb-glow-feature-flagship-customization)
6. [Current Visual Design System](#6-current-visual-design-system)
7. [Design Direction We Are Aiming For](#7-design-direction-we-are-aiming-for)
8. [Component & Surface Inventory](#8-component--surface-inventory)
9. [Responsive & Accessibility Notes](#9-responsive--accessibility-notes)
10. [Known Gaps & Future Features](#10-known-gaps--future-features)
11. [Technical Constraints for Design](#11-technical-constraints-for-design)
12. [Designer Deliverables (Suggested)](#12-designer-deliverables-suggested)

---

## 1. Product Overview

**YNA Chat** is a real-time **1:1 messaging web application**. Users sign in with Clerk (email/password, Google, etc.), then chat directly with other registered users.

| Attribute | Detail |
|-----------|--------|
| **Platform** | Web app (React SPA), responsive for desktop and mobile |
| **Auth** | Clerk — sign-in required to access chat |
| **Real-time** | Socket.io for instant message delivery and online presence |
| **Media** | Images, videos, audio, documents, voice notes via ImageKit CDN |
| **Location** | Static map pins + live location sharing |
| **Calls** | 1:1 voice calls via LiveKit (WebRTC) |
| **Visual identity** | Dark-first, glass/neon aesthetic built around a customizable **RGB animated border glow** |

The app is intentionally **personalization-heavy**: users can customize light/dark mode, accent color presets, and the RGB outer glow independently.

---

## 2. Target Users & Core Use Cases

### Primary use cases

1. **Private 1:1 chat** — text conversations with read receipts and unread badges
2. **Rich media sharing** — photos, videos, files, voice messages
3. **Location coordination** — send a pin or share live location during travel/emergency
4. **Voice calls** — start or receive audio calls when both users are online
5. **Personalization** — tune the app's look (theme, accent, RGB glow) to personal taste

### User expectations

- Fast, real-time messaging (WhatsApp/Telegram-like familiarity)
- Clear online/offline status
- Non-intrusive but configurable notifications
- A distinctive, modern visual identity (the RGB frame is a key differentiator)

---

## 3. Application Screens & Navigation

### Routes

| Route | Screen | Access |
|-------|--------|--------|
| `/auth` | Sign-in page | Signed-out users only |
| `/` | Main chat app | Signed-in users only |

### Auth screen layout

```
┌─────────────────────────────────────────────────────────┐
│  [RGB animated border — full viewport frame]            │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Header: Logo · App name · RGB · Theme · Light/Dark│  │
│  ├──────────────────────┬────────────────────────────┤  │
│  │ Hero panel (left)    │ Sign-in card (right)       │  │
│  │ · Branding copy      │ · Logo tile with glow      │  │
│  │ · Floating hero img  │ · "Continue" → Clerk modal │  │
│  │ · Grid/mesh pattern  │ · Security footer          │  │
│  └──────────────────────┴────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Chat screen layout (desktop)

```
┌─────────────────────────────────────────────────────────┐
│  [RGB animated border — full viewport frame]            │
│  ┌──────────────┬────────────────────────────────────┐  │
│  │ SIDEBAR      │ MAIN CHAT PANEL                    │  │
│  │ · Logo/name  │ · Header: peer info + toolbar      │  │
│  │ · Search     │ · Message list                     │  │
│  │ · Tabs:      │ · Composer (input + attachments)   │  │
│  │   Chats/Users│                                    │  │
│  │ · Conv. list │                                    │  │
│  │ · UserButton │                                    │  │
│  └──────────────┴────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Chat screen layout (mobile)

- Sidebar shows when **no conversation** is selected
- When a conversation is open, sidebar hides and the chat panel fills the width
- Back chevron in header returns to conversation list

---

## 4. Feature Inventory

### 4.1 Authentication & Account

| Feature | Description | UI touchpoints |
|---------|-------------|----------------|
| **Clerk sign-in** | Email/password, OAuth (Google, etc.) via Clerk modal | Auth page "Continue" button |
| **User profile sync** | Avatar and name from Clerk synced to MongoDB | Sidebar UserButton, chat header avatar |
| **Session persistence** | Stays signed in across reloads | — |
| **Sign out** | Via Clerk UserButton menu | Sidebar top-right |

---

### 4.2 Conversations & Sidebar

| Feature | Description | UI touchpoints |
|---------|-------------|----------------|
| **Conversation list** | Users you've chatted with, sorted by activity | Sidebar "Chats" tab |
| **All users list** | Every registered user (to start new chats) | Sidebar "Users" tab |
| **Search** | Filter conversations/users by name | Sidebar search field |
| **Unread badges** | Count per conversation (capped at "99+") | Conversation row badge |
| **Last message preview** | Truncated preview + timestamp | Conversation row |
| **Selected state** | Highlighted row with accent glow | Conversation row |
| **Empty search** | "No conversations/people match your search" | Sidebar panel |

---

### 4.3 Messaging — Text

| Feature | Description | UI touchpoints |
|---------|-------------|----------------|
| **Send text** | Enter to send, Shift+Enter for new line | Composer textarea |
| **Reply to message** | Quote original message in bubble | Message actions → Reply; reply bar above composer |
| **Message timestamps** | Shown in bubble footer | Message bubble |
| **Date divider** | "Today" label with line dividers | Message list |
| **Delete own messages** | Remove from both sides | Message actions → Delete |
| **Forward messages** | Send to another user | Message actions → Forward → modal picker |
| **Real-time delivery** | Messages appear instantly | Message list auto-scroll |
| **Read receipts** | `readAt` tracked server-side; unread counts update | Sidebar badge, tab title |

---

### 4.4 Messaging — Media & Attachments

| Feature | Description | UI touchpoints |
|---------|-------------|----------------|
| **Image upload** | Inline preview in bubble | Composer image button |
| **Video upload** | Embedded video player in bubble | Composer image button |
| **Audio files** | Native `<audio>` controls in bubble | Composer image button |
| **Documents** | PDF, Word, Excel, PowerPoint, TXT, RTF | Document card in bubble with download |
| **Multi-file send** | Up to 10 files per message | File picker (multiple) |
| **File size limit** | 25 MB per file | Error toast if exceeded |
| **Upload progress** | "Sending..." banner above composer | Composer area |
| **Image optimization** | ImageKit transforms for thumbnails | Automatic |

**Supported file types:** images, videos, audio, PDF, Office docs, plain text, RTF.

---

### 4.5 Messaging — Voice Notes

| Feature | Description | UI touchpoints |
|---------|-------------|----------------|
| **Tap to record** | Mic button when composer is empty | Composer mic button |
| **Recording UI** | Red pulse dot, timer, Cancel/Stop | Composer recording bar |
| **Preview before send** | Play/pause preview, duration, Send/Discard | Composer preview bar |
| **Min duration** | 1 second minimum | Error toast if too short |
| **Voice playback in chat** | Custom voice message component | Message bubble |
| **Mic permission** | Browser permission required | Toast on denial |

---

### 4.6 Location Features

| Feature | Description | UI touchpoints |
|---------|-------------|----------------|
| **Static location pin** | Tap location button → map picker modal | Composer location button |
| **GPS "Use my location"** | Crosshair button in map modal | LocationPickerModal |
| **Map interaction** | Click/drag marker on Leaflet map | LocationPickerModal |
| **Reverse geocoding label** | Address label when server configured | Location message bubble |
| **Location in bubble** | Map preview + coordinates + link | MessageLocation component |
| **Live location sharing** | Periodic GPS pings on interval | EmergencyLocationModal |
| **Emergency live location** | Long-press location button OR chevron menu | EmergencyLocationModal |
| **Frequency presets** | 1s, 5s, 30s, 1min, 5min, 1hr (configurable) | Emergency modal |
| **Custom interval** | User-defined value + unit | Emergency modal |
| **Active session banner** | Red pulsing indicator, elapsed time, update count, Stop | Composer banner |
| **Live location grouping** | Consecutive pings grouped in message list | LiveLocationGroup component |
| **Session end message** | Optional "sharing ended" text message | Automatic |

---

### 4.7 Presence & Online Status

| Feature | Description | UI touchpoints |
|---------|-------------|----------------|
| **Online indicator** | Green dot on avatar (socket connected) | AvatarWithOnlineIndicator |
| **Offline state** | Muted dot, "Offline" label | Chat header subtitle |
| **Online label** | Green "Online" text | Chat header subtitle |
| **Call availability** | Phone button disabled when peer offline | Chat header |

---

### 4.8 Notifications & Sounds

| Feature | Description | UI touchpoints | Persisted |
|---------|-------------|----------------|-----------|
| **In-app toast** | Toast when message arrives in non-active chat | React Hot Toast | No |
| **Message sound** | Optional notification sound | Bell toggle in header | Yes |
| **Browser notifications** | Desktop notification when tab hidden | Tied to bell toggle | Yes |
| **Tab title badge** | `(3) YNA Chat` unread count | Browser tab | No |
| **Keyboard sounds** | Keystroke sounds while typing | Volume toggle in header | Yes |

All sound/notification preferences persist in `localStorage`.

---

### 4.9 Voice Calls (LiveKit)

| Feature | Description | UI touchpoints |
|---------|-------------|----------------|
| **Start call** | Phone icon in chat header (peer must be online) | ChatHeader |
| **Incoming call** | Modal with Accept/Reject + ringtone | AudioCallModal |
| **Outgoing call** | "Ringing…" + cancel + ringback tone | AudioCallModal |
| **Active call** | Duration timer, mute toggle, end call | AudioCallModal |
| **Missed call** | "Call not answered" state | AudioCallModal |
| **Connecting state** | "Connecting…" with loader | AudioCallModal |

Call signaling uses Socket.io events: `call:incoming`, `call:accepted`, `call:rejected`, `call:ended`.

---

### 4.10 UI Customization (Three Independent Layers)

The app has **three separate customization systems** that work together but are configured independently:

| Layer | What it controls | Settings location | Storage key |
|-------|------------------|-------------------|-------------|
| **Light / Dark mode** | Base background, text, surfaces | Sun/Moon toggle in header | `theme` |
| **Accent theme preset** | Buttons, own message bubbles, focus rings, links | Palette icon → modal | `theme-preset` |
| **RGB Glow** | Animated outer border + ambient glow | Sparkles icon → modal | `rgb-theme-id`, `rgb-speed-id`, `rgb-intensity-id` |

#### Accent theme presets (11 options)

Default, Sky, Lavender, Mint, Netflix, Uber, Spotify, Coinbase, Airbnb, Discord, Rabbit.

These change the HeroUI `--accent` CSS variable only — they do **not** change the RGB border gradient.

---

## 5. RGB Glow Feature (Flagship Customization)

The **RGB Glow** is the newest and most distinctive visual feature. It is the primary brand differentiator we want preserved and refined — not removed — in any redesign.

### 5.1 What it is

An **animated, multi-color conic gradient** that wraps the entire application frame (both Auth and Chat screens). It creates:

1. **Rotating border** — A 3px padding ring around the inner panel where a large conic gradient spins continuously
2. **Ambient glow** — An optional blurred, pulsing backdrop layer behind the inner content that extends the RGB colors into the surrounding space
3. **Dark outer shell** — Deep black (`#030306`) page background with subtle mesh gradients and a fine grid texture

### 5.2 Visual structure (layers, outside → inside)

```
Layer 0: Page backdrop        → Deep black + accent-tinted mesh + grid texture
Layer 1: RGB border ring      → Rotating conic gradient (3px visible border)
Layer 2: Ambient glow blur    → Optional pulsing blurred gradient (user-controlled)
Layer 3: Inner glass panel    → Frosted content area (messages, sidebar, etc.)
```

The RGB glow lives **outside** the functional UI. Message bubbles, inputs, and lists sit inside the glass panel and are **not** directly painted with the RGB gradient — they use accent colors and glass effects that **harmonize** with the glow.

### 5.3 User controls (RGB Customizer modal)

Opened via the **Sparkles (✨) icon** in the header (Auth and Chat).

| Setting | Options | Default |
|---------|---------|---------|
| **Glow Preset** | 6 gradient themes (see below) | Rainbow Flow |
| **Animation Speed** | Slow (12s), Medium (6s), Fast (3s) | Medium |
| **Ambient Glow** | Off, Low, Medium, High | Medium |

Settings persist in `localStorage` and apply instantly without reload.

### 5.4 Glow presets

| ID | Label | Color character |
|----|-------|-----------------|
| `rainbow-flow` | Rainbow Flow | Full spectrum — red, orange, yellow, green, blue, violet |
| `cyberpunk` | Cyberpunk | Hot pink, purple, cyan |
| `aurora` | Cosmic Aurora | Green, cyan, blue, purple |
| `fire` | Volcanic Fire | Red, orange, amber |
| `matrix` | Matrix Neon | Bright green, dark green |
| `violet` | Electric Violet | Purple, lavender, soft violet |

Each preset is a **conic gradient** that rotates 360° continuously.

### 5.5 Ambient glow intensity levels

| Level | Blur | Opacity | Effect |
|-------|------|---------|--------|
| Off | 0 | 0 | Border only, no backdrop glow |
| Low | 16px | 0.30 | Subtle halo |
| Medium | 24px | 0.55 | Balanced glow (default) |
| High | 36px | 0.85 | Strong ambient light |

The glow also **pulses** (opacity and blur scale) on a 4-second cycle independent of rotation speed.

### 5.6 Alert mode (prepared, not yet wired to UI)

The codebase includes an **alert override** API (`triggerAlert` / `clearAlert`) that temporarily switches to a red/amber flashing gradient at fast speed. This is intended for future use (incoming calls, urgent messages) but is **not connected to any user action yet**. Consider this in future UX flows.

### 5.7 RGB design intent (what we want the designer to preserve)

> **The RGB frame is not decorative clutter — it is the product's signature.**

We are aiming for a **"premium gaming / cyberpunk / neon glass"** aesthetic:

- The outer RGB ring should feel like a **living, breathing light strip** around a premium device or monitor
- The inner UI should feel like **frosted glass floating inside a light box**
- Accent colors (user-selected theme preset) should **echo** the RGB glow without competing with it
- Dark mode is the **primary designed experience**; light mode should still work but secondary
- Motion should feel smooth and ambient — not distracting during reading/chatting
- The glow should enhance **emotional personalization** ("this is *my* chat space")

**Avoid in redesign:**
- Flat, generic corporate SaaS look that ignores the RGB frame
- Making the RGB border so subtle it disappears
- Painting message bubbles with full rainbow gradients (too noisy)
- Clashing neon inside + neon outside with no hierarchy

**Encourage in redesign:**
- Clear visual hierarchy: RGB frame → glass shell → content
- Consistent glass/frosted surfaces inside the panel
- Accent-colored micro-glows on interactive elements (selected row, send button, focus states)
- Typography that feels modern and readable against dark glass
- Settings UX that makes RGB + accent + light/dark feel like one cohesive "Appearance" system

---

## 6. Current Visual Design System

### 6.1 Design tokens & tech

| System | Usage |
|--------|-------|
| **HeroUI 3** | Component library (Button, Modal, Avatar, Tabs, SearchField, TextArea, etc.) |
| **Tailwind CSS 4** | Utility styling |
| **CSS custom properties** | HeroUI semantic tokens: `--background`, `--foreground`, `--accent`, `--muted`, `--surface`, `--border` |
| **Custom CSS classes** | Glass panels, RGB utilities, message bubbles (`frontend/src/index.css`) |

### 6.2 Color & surface language (current implementation)

| Element | Current treatment |
|---------|-------------------|
| **Page backdrop** | `#030306` + accent/purple/cyan radial mesh + 32px grid |
| **Inner panel** | 82–88% opacity background + 28px backdrop blur + subtle white border |
| **Headers** | Frosted glass (`glass-header`) + RGB accent line at top edge |
| **Sidebar** | Glass panel (`glass-sidebar`) + shimmer animated brand title |
| **Conversation rows** | Rounded cards; selected = accent tint + soft glow shadow |
| **Own messages** | Accent gradient bubble + inner highlight + accent shadow |
| **Peer messages** | Frosted surface bubble + thin white border |
| **Composer** | Glass footer + rounded input wrap with accent-tinted shadow |
| **Empty state** | Pulsing accent orb with float animation |
| **Modals (RGB/Theme)** | Dark glass (`glass-modal`) + accent ring on selected swatch |
| **Toolbar** | Pill-shaped cluster (`toolbar-cluster`) for header icon buttons |

### 6.3 Typography (current)

- **Brand title:** Animated shimmer gradient text (`brand-title`)
- **App name size:** ~22px bold in sidebar, ~15px in header
- **Message text:** 15px, relaxed line height
- **Timestamps:** 11px tabular nums, muted or accent-foreground/75
- **Date divider:** 11px uppercase, letter-spaced, with gradient lines
- **Auth hero:** Uppercase mono-style labels (secure gateway, encrypted in transit)

### 6.4 Iconography

- **Lucide React** icons throughout
- Key icons: Sparkles (RGB), Palette (accent theme), Sun/Moon (light/dark), Phone, Bell, Volume, MapPin, Mic, Image, Send

### 6.5 Motion & animation (current)

| Animation | Where | Duration |
|-----------|-------|----------|
| RGB border spin | Outer frame | 3s / 6s / 12s (user setting) |
| RGB glow pulse | Ambient layer | 4s ease-in-out |
| Brand title shimmer | App name | 6s linear loop |
| Empty state float | No-chat placeholder | 4s ease-in-out |
| Auth hero mesh drift | Auth left panel | 8s ease-in-out |
| Auth hero image float | Auth illustration | 4.5s ease-in-out |
| Loader spin | Loading states | Continuous |

### 6.6 Border radius language (current)

| Element | Radius |
|---------|--------|
| RGB outer frame | 24px (`rounded-3xl`) |
| Inner panel | 21px |
| Conversation rows | 14px |
| Message bubbles | 16px (with one corner at 6px for "tail" effect) |
| Composer input wrap | 20px |
| Modals / auth card | 28px |

---

## 7. Design Direction We Are Aiming For

### 7.1 North star

**"A personal, premium chat space wrapped in living RGB light."**

Think: Discord's customization energy + Apple glass aesthetics + gaming peripheral RGB — but applied to a **messaging product**, not a game launcher.

### 7.2 Mood keywords

- Neon · Glass · Dark · Premium · Personal · Alive · Modern · Clean

### 7.3 Design principles for the redesign

1. **RGB is the frame, not the content** — Keep the animated border as the hero; keep chat content readable and calm
2. **Unify customization** — Today, RGB / accent / light-dark are three separate modals; consider one "Appearance" hub
3. **Dark-first** — Design for dark mode first; adapt to light mode second
4. **Glass with hierarchy** — Multiple glass layers (shell → sidebar → composer) with distinct depth, not one flat blur everywhere
5. **Accent coherence** — Inner accent color should complement the chosen RGB preset (design pairing suggestions welcome)
6. **Motion with purpose** — RGB spins always; other animations only on interaction or empty states
7. **Mobile-native feel** — Sidebar ↔ chat transition should feel intentional on small screens
8. **Accessibility** — Glow and blur must not break contrast for message text; provide reduced-motion and reduced-glow options

### 7.4 Areas we'd like the designer to improve

| Area | Current pain / opportunity |
|------|---------------------------|
| **Settings UX** | Three separate icons (Sparkles, Palette, Sun/Moon) — could be one cohesive settings panel |
| **Visual hierarchy on mobile** | Header toolbar gets crowded with many icon buttons |
| **Light mode** | Glass/neon system is optimized for dark; light mode needs dedicated design |
| **Auth page** | Hero + sign-in split works on desktop; mobile stacking could be more polished |
| **Message list density** | Room to improve spacing, grouping, and timestamp placement |
| **Location UI** | Map modals and live location banners are functional but not visually integrated with RGB theme |
| **Call modal** | Standard HeroUI modal — could feel more immersive/premium |
| **Empty states** | Only one empty state (no conversation selected); could add more guidance |
| **Onboarding** | No first-run tour for RGB customization or location long-press |

---

## 8. Component & Surface Inventory

Use this as a checklist when redesigning — every surface must remain functional.

### Pages
- `AuthPage` — Sign-in shell with RGB frame
- `ChatPage` — Main app shell with RGB frame

### Auth components
- `AuthHeader` — Logo, title, customization toolbar
- `AuthHeroPanel` — Left branding panel with illustration
- `AuthHeroPattern` — Background grid and mesh
- `AuthActionPanel` — Sign-in card with Clerk trigger
- `AuthCardShell` — Glass card wrapper

### Chat components
- `ChatSidebar` — Logo, search, tabs, conversation list, Clerk UserButton
- `ConversationRow` — Avatar, name, preview, time, unread badge
- `ChatHeader` — Peer info, back button (mobile), toolbar
- `MessageList` — Scrollable messages + date divider
- `MessageBubble` — Text, media, reply quote, actions
- `MessageVideo` / `MessageVoice` / `MessageDocument` / `MessageLocation` — Media renderers
- `LiveLocationGroup` — Grouped live location pings
- `ChatComposer` — Input, attachments, voice, location, reply bar, status banners
- `NoConversationPlaceholder` — Empty main panel state
- `AvatarWithOnlineIndicator` — Avatar + presence dot

### Modals & overlays
- `RgbCustomizer` — RGB glow settings
- `ThemePresetPicker` — Accent color presets
- `LocationPickerModal` — Leaflet map for static pin
- `EmergencyLocationModal` — Live location setup/stop
- `ForwardMessageModal` — Forward message to user
- `MessageActionsMenu` — Reply / Forward / Delete dropdown
- `AudioCallModal` — Voice call UI

### Shared
- `AppLogo` — Brand logo image
- `ThemeToggle` — Light/dark switch
- `PageLoader` — Full-screen loading state
- `Toaster` — Toast notifications (React Hot Toast)

---

## 9. Responsive & Accessibility Notes

### Breakpoints (current behavior)

| Breakpoint | Behavior |
|------------|----------|
| `< lg` (mobile/tablet) | Sidebar OR chat panel (not both visible when chatting) |
| `≥ lg` | Sidebar (288px) + chat panel side by side |
| `< 400px` | RGB and Theme preset icons hidden in header (Theme toggle still visible) |

### Accessibility considerations for redesign

- **Reduced motion:** Respect `prefers-reduced-motion` — disable RGB spin, shimmer, float animations
- **Reduced glow:** Consider a "static border" mode for photosensitivity
- **Contrast:** Message text must meet WCAG AA on both bubble types
- **Focus states:** Visible keyboard focus on all interactive elements
- **Screen readers:** Online status, unread counts, recording state, live location active — all need clear labels (partially implemented)
- **Touch targets:** Minimum 44px for mobile buttons (location long-press = 500ms)

---

## 10. Known Gaps & Future Features

### Not implemented (do not design as existing)

| Feature | Status |
|---------|--------|
| **Wallpapers** | Mentioned in README but **not built** — no wallpaper picker exists |
| **RGB alert mode** | API exists, **not wired** to incoming calls/messages |
| **Group chats** | Not supported — 1:1 only |
| **Message editing** | Not supported |
| **Typing indicators** | Not supported |
| **End-to-end encryption UI** | Marketing copy only ("Encrypted in transit" = TLS) |

### Implemented but could be enhanced

- Voice calls (LiveKit) — functional, UI is basic
- Live location — functional, UX for long-press is hidden/discovered by accident
- Forward message — works, modal is minimal

---

## 11. Technical Constraints for Design

Keep these in mind so designs are implementable:

1. **Component library:** HeroUI 3 — prefer using its components over fully custom widgets where possible
2. **Styling:** Tailwind CSS 4 + CSS custom properties — designs should map to tokens, not hard-coded hex everywhere
3. **RGB is CSS-based:** The glow is conic gradients + CSS animations — not video, not Lottie, not WebGL
4. **Maps:** Leaflet + OpenStreetMap tiles — map UI must work within Leaflet's constraints
5. **Auth UI:** Clerk owns the sign-in modal — we only design the trigger card, not the Clerk form itself
6. **Avatars:** From Clerk / user profile URL — design for round avatars with optional online dot
7. **File uploads:** Native file picker — no custom drag-and-drop upload zone exists yet
8. **No native app:** Web only — design for browser chrome, not iOS/Android system UI

---

## 12. Designer Deliverables (Suggested)

We recommend the designer deliver:

1. **Figma (or similar) file** with:
   - Auth screen (desktop + mobile)
   - Chat screen — no conversation selected
   - Chat screen — active conversation with mixed message types
   - RGB Customizer modal
   - Unified Appearance settings (proposed)
   - Location picker + emergency live location modals
   - Voice call modal
   - Component library (buttons, inputs, bubbles, rows, badges)

2. **Design system page:**
   - Color tokens (dark + light)
   - Typography scale
   - Spacing & radius scale
   - Glass surface specs (blur, opacity, border)
   - RGB frame specs (how inner UI relates to outer glow)
   - Motion guidelines

3. **RGB preset mockups** — Show at least 3 presets (Rainbow, Cyberpunk, Matrix) with recommended inner accent pairings

4. **Accessibility variants** — Reduced motion, high contrast, glow-off mode

5. **Brief rationale** — Why the redesign improves usability while keeping the RGB identity

---

## Quick Reference — Feature Checklist

Use this to verify nothing is missed in the redesign:

- [ ] Clerk sign-in / sign-out
- [ ] Conversation list with search
- [ ] All users list with search
- [ ] Unread badges + tab title count
- [ ] Text messaging + Enter to send
- [ ] Reply to message
- [ ] Delete own message
- [ ] Forward message
- [ ] Image / video / audio / document messages
- [ ] Voice note record → preview → send
- [ ] Static location (map picker + GPS)
- [ ] Live / emergency location sharing
- [ ] Online/offline presence
- [ ] Message notification sound toggle
- [ ] Keyboard sound toggle
- [ ] Browser notifications
- [ ] 1:1 voice call (start, receive, mute, end)
- [ ] Light / dark mode toggle
- [ ] 11 accent theme presets
- [ ] **RGB Glow: 6 presets × 3 speeds × 4 intensities**
- [ ] Responsive mobile sidebar ↔ chat
- [ ] Loading state
- [ ] Toast notifications
- [ ] Empty states

---

*Document version: 1.0 — Generated for UI/UX redesign handoff.*  
*App: YNA Chat · Platform: Web (React + HeroUI + Tailwind)*
