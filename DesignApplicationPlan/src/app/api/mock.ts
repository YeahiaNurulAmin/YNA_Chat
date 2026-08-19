// Mock dataset matching the real API types. Served automatically in preview
// (USE_MOCK) so the Cyber Neon interface renders without a live backend.

import type { Conversation, Message, User } from "./types";

export const CURRENT_USER: User = {
  _id: "me",
  email: "you@ynachat.io",
  fullName: "You",
  profilePicture: "https://i.pravatar.cc/150?img=13",
};

export const MOCK_USERS: User[] = [
  {
    _id: "u_alex",
    email: "alex@example.com",
    fullName: "Alex Rivera",
    profilePicture: "https://i.pravatar.cc/150?img=12",
  },
  {
    _id: "u_maya",
    email: "maya@example.com",
    fullName: "Maya Chen",
    profilePicture: "https://i.pravatar.cc/150?img=45",
  },
  {
    _id: "u_kofi",
    email: "kofi@example.com",
    fullName: "Kofi Mensah",
    profilePicture: "https://i.pravatar.cc/150?img=33",
  },
  {
    _id: "u_lena",
    email: "lena@example.com",
    fullName: "Lena Novak",
    profilePicture: "https://i.pravatar.cc/150?img=24",
  },
  {
    _id: "u_sam",
    email: "sam@example.com",
    fullName: "Sam Okafor",
    profilePicture: "https://i.pravatar.cc/150?img=8",
  },
];

const empty = { image: [], video: [], voice: [], audio: [], document: [] };

function msg(partial: Partial<Message> & Pick<Message, "_id" | "senderId" | "receiverId" | "createdAt">): Message {
  return { ...empty, ...partial };
}

// Per-peer message history keyed by peer user id.
export const MOCK_MESSAGES: Record<string, Message[]> = {
  u_alex: [
    msg({ _id: "m1", senderId: "u_alex", receiverId: "me", text: "Hey! Did you get the new build running?", createdAt: iso(-58) }),
    msg({ _id: "m2", senderId: "me", receiverId: "u_alex", text: "Yeah, spinning it up now 🚀", createdAt: iso(-56) }),
    msg({
      _id: "m3",
      senderId: "u_alex",
      receiverId: "me",
      text: "Nice. Here's the screenshot from earlier",
      image: ["https://picsum.photos/seed/yna1/400/280"],
      createdAt: iso(-40),
    }),
    msg({
      _id: "m4",
      senderId: "me",
      receiverId: "u_alex",
      text: "Looks clean. Meet at HQ?",
      replyTo: { messageId: "m3", text: "Here's the screenshot from earlier", senderName: "Alex Rivera" },
      createdAt: iso(-20),
    }),
    msg({
      _id: "m5",
      senderId: "u_alex",
      receiverId: "me",
      location: { lat: 40.7128, lng: -74.006, label: "Financial District, New York, NY" },
      createdAt: iso(-8),
    }),
    msg({ _id: "m6", senderId: "u_alex", receiverId: "me", text: "Let's meet up!", createdAt: iso(-2) }),
  ],
  u_maya: [
    msg({ _id: "n1", senderId: "me", receiverId: "u_maya", text: "The mockups are ready for review", createdAt: iso(-180) }),
    msg({ _id: "n2", senderId: "u_maya", receiverId: "me", text: "Amazing, taking a look now", createdAt: iso(-175) }),
    msg({ _id: "n3", senderId: "u_maya", receiverId: "me", text: "Love the glass direction 💜", createdAt: iso(-170) }),
  ],
  u_kofi: [
    msg({ _id: "k1", senderId: "u_kofi", receiverId: "me", text: "call me when you're free", createdAt: iso(-320) }),
  ],
  u_lena: [
    msg({ _id: "l1", senderId: "u_lena", receiverId: "me", text: "Deploy went out ✅", createdAt: iso(-1440) }),
    msg({ _id: "l2", senderId: "me", receiverId: "u_lena", text: "Perfect, thanks Lena", createdAt: iso(-1435) }),
  ],
  u_sam: [
    msg({ _id: "s1", senderId: "u_sam", receiverId: "me", text: "sent over the report", document: ["https://example.com/report.pdf"], createdAt: iso(-2880) }),
  ],
};

export const MOCK_CONVERSATIONS: Conversation[] = MOCK_USERS.map((u) => {
  const history = MOCK_MESSAGES[u._id] ?? [];
  const last = history[history.length - 1] ?? null;
  const unread = history.filter((m) => m.senderId === u._id && !m.readAt).length;
  return {
    _id: u._id,
    fullName: u.fullName,
    profilePic: u.profilePicture,
    email: u.email,
    unreadCount: u._id === "u_alex" ? 2 : u._id === "u_kofi" ? 1 : 0,
    lastMessage: last,
  };
});

export const MOCK_ONLINE_IDS: string[] = ["u_alex", "u_maya", "u_sam"];

// minutes offset from now -> ISO string
function iso(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function makeLocalMessage(peerId: string, text: string): Message {
  return msg({
    _id: `local_${Date.now()}`,
    senderId: "me",
    receiverId: peerId,
    text,
    createdAt: new Date().toISOString(),
  });
}

export function makeLocationMessage(peerId: string, location: Message["location"]): Message {
  return msg({
    _id: `local_${Date.now()}`,
    senderId: "me",
    receiverId: peerId,
    location,
    createdAt: new Date().toISOString(),
  });
}

export function makeVoiceMessage(peerId: string, durationSec: number, url = "mock://voice"): Message {
  return msg({
    _id: `local_${Date.now()}`,
    senderId: "me",
    receiverId: peerId,
    voice: [url],
    voiceDurationSec: durationSec,
    createdAt: new Date().toISOString(),
  });
}
