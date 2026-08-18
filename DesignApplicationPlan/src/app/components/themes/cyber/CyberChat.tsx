import { useEffect, useRef, useState } from "react";
import { ChevronLeft, MapPin, Mic, Paperclip, Phone, PenSquare, Search, Send, Settings, Trash2, Video } from "lucide-react";
import type { UseChat } from "../../../hooks/useChat";
import type { LocationPin } from "../../../api/types";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { formatTime, groupByDay, initials, isOwn, messagePreview, toPeerDisplay } from "../shared";
import { CyberLocationModal } from "./CyberLocationModal";
import { CyberVoicePlayer } from "./CyberVoicePlayer";
import { CyberCallOverlay, type CallSession } from "./CyberCallOverlay";
import { CyberSettingsPage } from "./CyberSettingsPage";
import { CyberNewChatModal } from "./CyberNewChatModal";
import { EmergencyLocationModal } from "./EmergencyLocationModal";
import { YNALogo } from "../../ui/YNALogo";

const FONT = "'Space Grotesk', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const CYAN = "#22d3ee";
const MAGENTA = "#f0f";
const VIOLET = "#8b5cf6";

export function CyberChat({ chat }: { chat: UseChat }) {
  const { conversations, users, activePeerId, activePeer, messages, selectConversation, sendText, sendLocation, sendVoice, isOnline } = chat;
  const [draft, setDraft] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [call, setCall] = useState<CallSession | null>(null);
  const peer = toPeerDisplay(activePeer);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const openConversation = (id: string) => {
    selectConversation(id);
    setMobileChatOpen(true);
  };

  const submit = () => {
    sendText(draft);
    setDraft("");
  };

  const startCall = (kind: "audio" | "video") => {
    if (!peer) return;
    setCall({ kind, state: "outgoing", peerName: peer.name, peerAvatar: peer.avatar });
  };

  if (showSettings) {
    return (
      <CyberSettingsPage
        currentUser={chat.currentUser}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div style={{ fontFamily: FONT, background: "#04040a", color: "#e2e8f0" }} className="w-full h-full p-2 sm:p-3 flex">
      <div
        className="w-full h-full rounded-2xl p-[2px] overflow-hidden"
        style={{
          background: `linear-gradient(120deg, ${CYAN}, ${VIOLET}, ${MAGENTA}, ${CYAN})`,
          backgroundSize: "300% 300%",
          animation: "cyberflow 6s linear infinite",
          boxShadow: `0 0 40px rgba(34,211,238,0.25), 0 0 60px rgba(255,0,255,0.15)`,
        }}
      >
        <div className="w-full h-full rounded-2xl flex overflow-hidden" style={{ background: "#06060f" }}>
          {/* Sidebar — full width on mobile, hidden when a chat is open */}
          <aside
            className={`${mobileChatOpen ? "hidden" : "flex"} lg:flex w-full lg:w-72 shrink-0 flex-col border-r`}
            style={{ borderColor: "rgba(34,211,238,0.15)", background: "rgba(8,8,20,0.9)" }}
          >
            <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(34,211,238,0.12)" }}>
              <div className="flex items-center gap-3">
                <YNALogo className="w-10 h-10" />
                <div>
                  <div style={{ fontFamily: MONO, letterSpacing: "0.15em", color: CYAN }}>YNA_CHAT</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: VIOLET }}>PROTOCOL 4.2</div>
                </div>
              </div>
            </div>

            <div className="px-3 py-3 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md flex-1" style={{ background: "rgba(139,92,246,0.08)", border: `1px solid rgba(139,92,246,0.35)` }}>
                <Search size={14} style={{ color: VIOLET }} />
                <input placeholder="search nodes..." className="bg-transparent outline-none w-full min-w-0" style={{ fontFamily: MONO, fontSize: 12, color: "#cbd5e1" }} />
              </div>
              <button
                onClick={() => setShowNewChat(true)}
                title="New conversation"
                className="w-9 h-9 rounded-md grid place-items-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${CYAN}, ${MAGENTA})`, boxShadow: `0 0 14px ${CYAN}66` }}
              >
                <PenSquare size={16} style={{ color: "#04040a" }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {conversations.map((c) => {
                const active = c._id === activePeerId;
                return (
                  <button
                    key={c._id}
                    onClick={() => openConversation(c._id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all"
                    style={{
                      background: active ? "rgba(34,211,238,0.08)" : "transparent",
                      border: active ? `1px solid ${CYAN}` : "1px solid transparent",
                      boxShadow: active ? `0 0 16px rgba(34,211,238,0.25)` : "none",
                    }}
                  >
                    <CyberAvatar name={c.fullName} src={c.profilePic} online={isOnline(c._id)} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: MONO, fontSize: 13, color: active ? CYAN : "#e2e8f0" }} className="truncate">{c.fullName}</span>
                        {c.unreadCount > 0 && (
                          <span className="px-1.5 rounded-full" style={{ background: MAGENTA, color: "#04040a", fontSize: 10, boxShadow: `0 0 10px ${MAGENTA}` }}>
                            {c.unreadCount > 99 ? "99+" : c.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="truncate" style={{ fontSize: 11, color: "#64748b" }}>{messagePreview(c.lastMessage)}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "rgba(34,211,238,0.12)" }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "#4ade80" }} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
                SYSTEM: SECURE
              </span>
              <button onClick={() => setShowSettings(true)} title="Settings" className="grid place-items-center">
                <Settings size={15} style={{ color: VIOLET }} />
              </button>
            </div>
          </aside>

          {/* Main — hidden on mobile until a chat is opened */}
          <main className={`${mobileChatOpen ? "flex" : "hidden"} lg:flex flex-1 flex-col min-w-0`}>
            {peer && (
              <header className="px-4 sm:px-5 py-3 flex items-center justify-between border-b" style={{ borderColor: "rgba(34,211,238,0.12)", background: "rgba(8,8,20,0.6)" }}>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button onClick={() => setMobileChatOpen(false)} className="lg:hidden w-8 h-8 grid place-items-center rounded-md shrink-0" style={{ color: CYAN, border: `1px solid ${CYAN}44` }}>
                    <ChevronLeft size={18} />
                  </button>
                  <CyberAvatar name={peer.name} src={peer.avatar} online={isOnline(peer.id)} size={38} />
                  <div className="min-w-0">
                    <div className="truncate" style={{ fontFamily: MONO, color: CYAN }}>{peer.name}</div>
                    <div style={{ fontSize: 11, color: isOnline(peer.id) ? "#4ade80" : "#64748b" }}>{isOnline(peer.id) ? "● ONLINE" : "○ OFFLINE"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <IconBtn color={VIOLET} onClick={() => startCall("video")}><Video size={16} /></IconBtn>
                  <IconBtn color={CYAN} onClick={() => startCall("audio")}><Phone size={16} /></IconBtn>
                </div>
              </header>
            )}

            <div ref={streamRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              {groupByDay(messages).map((group) => (
                <div key={group.day} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${CYAN})` }} />
                    <span style={{ fontFamily: MONO, fontSize: 10, color: CYAN, letterSpacing: "0.2em" }}>{group.day}</span>
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${MAGENTA}, transparent)` }} />
                  </div>
                  {group.items.map((m) => {
                    const own = isOwn(m);
                    const accent = own ? MAGENTA : CYAN;
                    return (
                      <div key={m._id} className={`flex flex-col ${own ? "items-end" : "items-start"}`}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: accent, marginBottom: 3 }}>{own ? "you" : peer?.name}</span>
                        <div
                          className="max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-lg"
                          style={{
                            background: own ? "rgba(255,0,255,0.06)" : "rgba(34,211,238,0.05)",
                            border: `1px solid ${accent}`,
                            boxShadow: `0 0 14px ${own ? "rgba(255,0,255,0.35)" : "rgba(34,211,238,0.3)"}`,
                            color: "#e2e8f0",
                          }}
                        >
                          {m.replyTo && (
                            <div className="mb-1.5 px-2 py-1 rounded text-xs" style={{ borderLeft: `2px solid ${VIOLET}`, background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>
                              <div style={{ fontFamily: MONO, fontSize: 9 }}>{m.replyTo.senderName}</div>
                              {m.replyTo.text}
                            </div>
                          )}
                          {m.image.map((src) => (
                            <ImageWithFallback key={src} src={src} alt="attachment" className="rounded-md mb-1.5 max-w-full" />
                          ))}
                          {m.voice.length > 0 && <CyberVoicePlayer durationSec={m.voiceDurationSec ?? 8} color={accent} />}
                          {m.location && <LocationCard location={m.location} accent={accent} />}
                          {m.text && <div>{m.text}</div>}
                          <div style={{ fontFamily: MONO, fontSize: 9, color: "#64748b", marginTop: 4, textAlign: "right" }}>{formatTime(m.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {peer && (
              <Composer
                draft={draft}
                setDraft={setDraft}
                onSubmit={submit}
                onOpenLocation={() => setShowLocation(true)}
                onOpenEmergency={() => setShowEmergency(true)}
                onSendVoice={(secs) => sendVoice(secs)}
              />
            )}
          </main>
        </div>
      </div>

      {showLocation && (
        <CyberLocationModal
          onClose={() => setShowLocation(false)}
          onConfirm={(pin: LocationPin) => {
            sendLocation(pin);
            setShowLocation(false);
          }}
        />
      )}

      {showEmergency && (
        <EmergencyLocationModal
          isOpen={showEmergency}
          onClose={() => setShowEmergency(false)}
          onStart={(interval) => {
            console.log("Starting emergency stream with interval:", interval);
            setShowEmergency(false);
            // In a real impl, this would trigger a background task or hook
            sendLocation({ lat: 40.7128, lng: -74.006, label: `EMERGENCY STREAM [${interval/1000}s]` });
          }}
        />
      )}

      {showNewChat && (
        <CyberNewChatModal
          users={users}
          isOnline={isOnline}
          onSelect={(userId) => {
            openConversation(userId);
            setShowNewChat(false);
          }}
          onClose={() => setShowNewChat(false)}
        />
      )}

      {call && <CyberCallOverlay call={call} onEnd={() => setCall(null)} />}

      <style>{`@keyframes cyberflow{0%{background-position:0% 50%}100%{background-position:300% 50%}}`}</style>
    </div>
  );
}

// ---- Composer with voice recording states ----
function Composer({
  draft,
  setDraft,
  onSubmit,
  onOpenLocation,
  onOpenEmergency,
  onSendVoice,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSubmit: () => void;
  onOpenLocation: () => void;
  onOpenEmergency: () => void;
  onSendVoice: (secs: number) => void;
}) {
  const [mode, setMode] = useState<"idle" | "recording" | "preview">("idle");
  const [secs, setSecs] = useState(0);
  const timerRef = useRef<number | null>(null);
  const locationTimerRef = useRef<number | null>(null);

  const handleLocationClick = (e: React.MouseEvent) => {
    // Basic long press logic
    const start = Date.now();
    const timeout = setTimeout(() => {
      onOpenEmergency();
      locationTimerRef.current = null;
    }, 500);
    
    const upHandler = () => {
      clearTimeout(timeout);
      if (Date.now() - start < 500) {
        onOpenLocation();
      }
      window.removeEventListener("mouseup", upHandler);
    };
    
    window.addEventListener("mouseup", upHandler);
  };

  useEffect(() => {
    if (mode === "recording") {
      timerRef.current = window.setInterval(() => setSecs((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  const startRec = () => {
    setSecs(0);
    setMode("recording");
  };
  const stopRec = () => setMode("preview");
  const cancelRec = () => {
    setSecs(0);
    setMode("idle");
  };
  const sendRec = () => {
    onSendVoice(Math.max(1, secs));
    setSecs(0);
    setMode("idle");
  };

  const timer = `${String(Math.floor(secs / 60)).padStart(1, "0")}:${String(secs % 60).padStart(2, "0")}`;

  if (mode === "recording") {
    return (
      <div className="px-4 sm:px-5 py-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "rgba(239,45,86,0.08)", border: `1.5px solid #ef2d56`, boxShadow: "0 0 18px rgba(239,45,86,0.35)" }}>
          <span className="w-3 h-3 rounded-full" style={{ background: "#ef2d56", boxShadow: "0 0 10px #ef2d56", animation: "recpulse 1s infinite" }} />
          <span style={{ fontFamily: MONO, fontSize: 13, color: "#fca5b5" }}>REC {timer}</span>
          <div className="flex-1" />
          <button onClick={cancelRec} className="px-3 py-1.5 rounded-md" style={{ fontFamily: MONO, fontSize: 12, color: "#94a3b8", border: "1px solid #475569" }}>CANCEL</button>
          <button onClick={stopRec} className="w-9 h-9 rounded-md grid place-items-center" style={{ background: "#ef2d56", boxShadow: "0 0 14px #ef2d56" }}>
            <span className="w-3 h-3 rounded-sm" style={{ background: "#fff" }} />
          </button>
        </div>
        <style>{`@keyframes recpulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      </div>
    );
  }

  if (mode === "preview") {
    return (
      <div className="px-4 sm:px-5 py-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "rgba(139,92,246,0.06)", border: `1.5px solid ${VIOLET}`, boxShadow: `0 0 18px rgba(139,92,246,0.35)` }}>
          <div className="flex-1"><CyberVoicePlayer durationSec={Math.max(1, secs)} color={VIOLET} /></div>
          <button onClick={cancelRec} className="w-9 h-9 rounded-md grid place-items-center" style={{ color: MAGENTA, border: `1px solid ${MAGENTA}55` }}>
            <Trash2 size={16} />
          </button>
          <button onClick={sendRec} className="w-9 h-9 rounded-md grid place-items-center" style={{ background: `linear-gradient(135deg, ${CYAN}, ${MAGENTA})`, boxShadow: `0 0 16px ${CYAN}` }}>
            <Send size={16} style={{ color: "#04040a" }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-5 py-4">
      <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg" style={{ background: "rgba(139,92,246,0.06)", border: `1.5px solid ${VIOLET}`, boxShadow: `0 0 18px rgba(139,92,246,0.35)` }}>
        <Paperclip size={18} style={{ color: VIOLET, cursor: "pointer" }} />
        <button 
          onMouseDown={handleLocationClick}
          title="Send location (Long press for Emergency)"
        >
          <MapPin size={18} style={{ color: CYAN }} />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onSubmit())}
          placeholder="> transmit message..."
          className="flex-1 bg-transparent outline-none min-w-0"
          style={{ fontFamily: MONO, fontSize: 13, color: "#e2e8f0" }}
        />
        {draft.trim() ? (
          <button onClick={onSubmit} className="w-9 h-9 rounded-md grid place-items-center shrink-0" style={{ background: `linear-gradient(135deg, ${CYAN}, ${MAGENTA})`, boxShadow: `0 0 16px ${CYAN}` }}>
            <Send size={16} style={{ color: "#04040a" }} />
          </button>
        ) : (
          <button onClick={startRec} className="w-9 h-9 rounded-md grid place-items-center shrink-0" style={{ color: CYAN, border: `1px solid ${CYAN}` }} title="Record voice">
            <Mic size={17} />
          </button>
        )}
      </div>
    </div>
  );
}

function LocationCard({ location, accent }: { location: NonNullable<import("../../../api/types").Message["location"]>; accent: string }) {
  const maps = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
  return (
    <a href={maps} target="_blank" rel="noreferrer" className="block rounded-md overflow-hidden mb-1" style={{ border: `1px solid ${accent}55`, minWidth: 200 }}>
      <div
        className="h-24 relative"
        style={{
          background: "#04040a",
          backgroundImage: "linear-gradient(rgba(34,211,238,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.14) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <MapPin size={24} className="absolute" style={{ left: "50%", top: "55%", transform: "translate(-50%,-100%)", color: MAGENTA, filter: `drop-shadow(0 0 6px ${MAGENTA})` }} />
      </div>
      <div className="px-2 py-1.5" style={{ background: "rgba(34,211,238,0.06)" }}>
        <div className="truncate" style={{ fontFamily: MONO, fontSize: 11, color: accent }}>{location.label ?? "Shared location"}</div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: "#64748b" }}>{location.lat}, {location.lng} · View on Maps ↗</div>
      </div>
    </a>
  );
}

function CyberAvatar({ name, src, online, size }: { name: string; src?: string; online: boolean; size: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full p-[2px]" style={{ background: `linear-gradient(135deg, ${CYAN}, ${MAGENTA})`, boxShadow: `0 0 12px rgba(34,211,238,0.5)` }}>
        <div className="w-full h-full rounded-full overflow-hidden grid place-items-center" style={{ background: "#06060f" }}>
          {src ? (
            <ImageWithFallback src={src} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span style={{ fontFamily: MONO, color: CYAN, fontSize: size * 0.32 }}>{initials(name)}</span>
          )}
        </div>
      </div>
      {online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ background: "#4ade80", borderColor: "#06060f", boxShadow: "0 0 8px #4ade80" }} />}
    </div>
  );
}

function IconBtn({ children, color, disabled, onClick }: { children: React.ReactNode; color: string; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-9 h-9 rounded-md grid place-items-center transition-all"
      style={{ color, border: `1px solid ${color}`, opacity: disabled ? 0.35 : 1, background: "transparent", boxShadow: disabled ? "none" : `0 0 10px ${color}55` }}
    >
      {children}
    </button>
  );
}
