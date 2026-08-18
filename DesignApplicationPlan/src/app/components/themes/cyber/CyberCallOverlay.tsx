import { useEffect, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff, Volume2 } from "lucide-react";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { initials } from "../shared";

const MONO = "'JetBrains Mono', monospace";
const CYAN = "#22d3ee";
const MAGENTA = "#f0f";
const VIOLET = "#8b5cf6";

export type CallKind = "audio" | "video";
export type CallState = "outgoing" | "connecting" | "active";

export interface CallSession {
  kind: CallKind;
  state: CallState;
  peerName: string;
  peerAvatar?: string;
}

export function CyberCallOverlay({ call, onEnd }: { call: CallSession; onEnd: () => void }) {
  const [state, setState] = useState<CallState>(call.state);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [camOff, setCamOff] = useState(false);

  // Simulated call progression: outgoing -> connecting -> active.
  useEffect(() => {
    if (state === "outgoing") {
      const t = setTimeout(() => setState("connecting"), 2200);
      return () => clearTimeout(t);
    }
    if (state === "connecting") {
      const t = setTimeout(() => setState("active"), 1600);
      return () => clearTimeout(t);
    }
  }, [state]);

  useEffect(() => {
    if (state !== "active") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  const timer = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const statusText =
    state === "outgoing" ? "RINGING…" : state === "connecting" ? "CONNECTING TO ENCRYPTED STREAM…" : `IN CALL · ${timer}`;

  const isVideo = call.kind === "video" && !camOff;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-between py-14" style={{ background: "rgba(2,2,8,0.92)", backdropFilter: "blur(10px)" }}>
      {/* Video backdrop (peer feed placeholder) */}
      {call.kind === "video" && state === "active" && (
        <div className="absolute inset-0 overflow-hidden">
          {isVideo ? (
            <div className="w-full h-full" style={{ background: "radial-gradient(circle at 50% 40%, rgba(34,211,238,0.15), #04040a 70%)" }}>
              <div className="absolute inset-0" style={{
                backgroundImage: "linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,255,0.06) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }} />
            </div>
          ) : (
            <div className="w-full h-full grid place-items-center" style={{ background: "#04040a" }}>
              <VideoOff size={64} style={{ color: "#334155" }} />
            </div>
          )}
          {/* Self view */}
          <div
            className="absolute top-6 right-6 w-28 h-40 rounded-xl overflow-hidden grid place-items-center"
            style={{ border: `1px solid ${MAGENTA}`, background: "#0a0a16", boxShadow: `0 0 18px ${MAGENTA}55` }}
          >
            <span style={{ fontFamily: MONO, fontSize: 10, color: MAGENTA }}>YOU</span>
          </div>
        </div>
      )}

      {/* Header status */}
      <div className="relative z-10 text-center">
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: VIOLET }}>
          {call.kind === "video" ? "◉ VIDEO CALL" : "◉ VOICE CALL"}
        </div>
      </div>

      {/* Peer identity */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative">
          {state !== "active" && (
            <span
              className="absolute inset-0 rounded-full"
              style={{ animation: "callpulse 1.6s ease-out infinite", border: `2px solid ${CYAN}` }}
            />
          )}
          <div
            className="w-36 h-36 rounded-full p-[3px]"
            style={{ background: `linear-gradient(135deg, ${CYAN}, ${MAGENTA})`, boxShadow: `0 0 40px ${CYAN}66` }}
          >
            <div className="w-full h-full rounded-full overflow-hidden grid place-items-center" style={{ background: "#06060f" }}>
              {call.peerAvatar ? (
                <ImageWithFallback src={call.peerAvatar} alt={call.peerName} className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontFamily: MONO, color: CYAN, fontSize: 44 }}>{initials(call.peerName)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-center">
          <div style={{ fontFamily: MONO, fontSize: 22, color: "#e2e8f0" }}>{call.peerName}</div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: state === "active" ? "#4ade80" : CYAN, marginTop: 6 }}>{statusText}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center gap-5">
        <CallBtn active={!muted} color={muted ? "#64748b" : CYAN} onClick={() => setMuted((m) => !m)}>
          {muted ? <MicOff size={22} /> : <Mic size={22} />}
        </CallBtn>

        {call.kind === "video" ? (
          <CallBtn active={!camOff} color={camOff ? "#64748b" : VIOLET} onClick={() => setCamOff((c) => !c)}>
            {camOff ? <VideoOff size={22} /> : <Video size={22} />}
          </CallBtn>
        ) : (
          <CallBtn active={speaker} color={speaker ? VIOLET : "#64748b"} onClick={() => setSpeaker((s) => !s)}>
            <Volume2 size={22} />
          </CallBtn>
        )}

        {/* End call */}
        <button
          onClick={onEnd}
          className="w-16 h-16 rounded-full grid place-items-center"
          style={{ background: "#ef2d56", boxShadow: "0 0 26px rgba(239,45,86,0.7)" }}
        >
          <PhoneOff size={26} color="#fff" />
        </button>
      </div>

      <style>{`@keyframes callpulse{0%{transform:scale(1);opacity:0.7}100%{transform:scale(1.6);opacity:0}}`}</style>
    </div>
  );
}

function CallBtn({ children, color, active, onClick }: { children: React.ReactNode; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-14 h-14 rounded-full grid place-items-center transition-all"
      style={{ color, border: `1px solid ${color}`, background: active ? `${color}18` : "transparent", boxShadow: active ? `0 0 14px ${color}55` : "none" }}
    >
      {children}
    </button>
  );
}
