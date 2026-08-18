// Small presentation helpers shared by all four theme UIs. These are logic-only
// (no styling) so each theme stays visually independent.

import type { Conversation, Message, User } from "../../api/types";

export interface PeerDisplay {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

export function toPeerDisplay(peer: Conversation | User | null): PeerDisplay | null {
  if (!peer) return null;
  const avatar = "profilePic" in peer ? peer.profilePic : peer.profilePicture;
  return { id: peer._id, name: peer.fullName, avatar, email: peer.email };
}

export function isOwn(message: Message, currentUserId = "me"): boolean {
  return message.senderId === currentUserId;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDay(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return "TODAY";
  return d.toLocaleDateString([], { month: "short", day: "numeric" }).toUpperCase();
}

// Groups messages by calendar day for date dividers.
export function groupByDay(messages: Message[]): Array<{ day: string; items: Message[] }> {
  const groups: Array<{ day: string; items: Message[] }> = [];
  for (const m of messages) {
    const day = formatDay(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  }
  return groups;
}

// A short one-line preview for conversation rows.
export function messagePreview(m: Message | null): string {
  if (!m) return "No messages yet";
  if (m.text) return m.text;
  if (m.image.length) return "📷 Photo";
  if (m.video.length) return "🎬 Video";
  if (m.voice.length) return "🎙️ Voice message";
  if (m.document.length) return "📄 Document";
  if (m.location) return "📍 Location";
  return "Message";
}
