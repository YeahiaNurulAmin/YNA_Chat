import { useState } from "react";
import {
  Bell,
  Check,
  ChevronLeft,
  Keyboard,
  LogOut,
  Palette,
  Shield,
  Sparkles,
  User as UserIcon,
  Volume2,
} from "lucide-react";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { initials } from "../shared";
import type { User } from "../../../api/types";

const MONO = "'JetBrains Mono', monospace";
const CYAN = "#22d3ee";
const MAGENTA = "#f0f";
const VIOLET = "#8b5cf6";

// Accent presets from the YNA spec.
const ACCENT_PRESETS: { name: string; color: string }[] = [
  { name: "Default", color: "#22d3ee" },
  { name: "Sky", color: "#0ea5e9" },
  { name: "Lavender", color: "#a78bfa" },
  { name: "Mint", color: "#10b981" },
  { name: "Netflix", color: "#e50914" },
  { name: "Uber", color: "#4b5563" },
  { name: "Spotify", color: "#1db954" },
  { name: "Coinbase", color: "#1652f0" },
  { name: "Airbnb", color: "#ff5a5f" },
  { name: "Discord", color: "#5865f2" },
  { name: "Rabbit", color: "#f97316" },
];

const GLOW_PRESETS = ["Rainbow Flow", "Cyberpunk", "Cosmic Aurora", "Volcanic Fire", "Matrix Neon", "Electric Violet"];
const SPEEDS = ["Slow · 12s", "Medium · 6s", "Fast · 3s"];
const INTENSITIES = ["Off", "Low", "Medium", "High"];

export function CyberSettingsPage({
  onClose,
  currentUser,
}: {
  onClose: () => void;
  currentUser: User;
}) {
  const [accent, setAccent] = useState("Default");
  const [glow, setGlow] = useState("Cyberpunk");
  const [speed, setSpeed] = useState("Medium · 6s");
  const [intensity, setIntensity] = useState("Medium");
  const [notifSound, setNotifSound] = useState(true);
  const [typingSound, setTypingSound] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: "#04040a", color: "#e2e8f0" }} className="w-full h-full p-2 sm:p-3 flex">
      <div
        className="w-full h-full rounded-2xl p-[2px] overflow-hidden"
        style={{
          background: `linear-gradient(120deg, ${CYAN}, ${VIOLET}, ${MAGENTA}, ${CYAN})`,
          backgroundSize: "300% 300%",
          animation: "cyberflow 6s linear infinite",
          boxShadow: `0 0 40px rgba(34,211,238,0.25), 0 0 60px rgba(255,0,255,0.15)`,
        }}
      >
        <div className="w-full h-full rounded-2xl flex flex-col overflow-hidden" style={{ background: "#06060f" }}>
          {/* Header */}
          <header className="px-5 py-4 flex items-center gap-3 border-b shrink-0" style={{ borderColor: "rgba(34,211,238,0.12)", background: "rgba(8,8,20,0.6)" }}>
            <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-md" style={{ color: CYAN, border: `1px solid ${CYAN}44` }}>
              <ChevronLeft size={18} />
            </button>
            <div>
              <div style={{ fontFamily: MONO, letterSpacing: "0.18em", color: CYAN }}>SETTINGS</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: VIOLET }}>SYSTEM CONFIGURATION</div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8 max-w-3xl w-full mx-auto">
            {/* Profile */}
            <Section icon={<UserIcon size={14} />} title="PROFILE">
              <div className="flex items-center gap-4 px-4 py-4 rounded-xl" style={{ background: "rgba(34,211,238,0.04)", border: `1px solid ${CYAN}33` }}>
                <div className="w-16 h-16 rounded-full p-[2px]" style={{ background: `linear-gradient(135deg, ${CYAN}, ${MAGENTA})`, boxShadow: `0 0 16px ${CYAN}66` }}>
                  <div className="w-full h-full rounded-full overflow-hidden grid place-items-center" style={{ background: "#06060f" }}>
                    {currentUser.profilePicture ? (
                      <ImageWithFallback src={currentUser.profilePicture} alt={currentUser.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span style={{ fontFamily: MONO, color: CYAN, fontSize: 22 }}>{initials(currentUser.fullName)}</span>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div style={{ fontFamily: MONO, color: "#e2e8f0", fontSize: 15 }}>{currentUser.fullName}</div>
                  <div className="truncate" style={{ fontSize: 12, color: "#64748b" }}>{currentUser.email}</div>
                </div>
                <button className="px-3 py-2 rounded-md" style={{ fontFamily: MONO, fontSize: 11, color: VIOLET, border: `1px solid ${VIOLET}` }}>EDIT</button>
              </div>
            </Section>

            {/* Accent theme presets */}
            <Section icon={<Palette size={14} />} title="ACCENT THEME">
              <div className="flex flex-wrap gap-2.5">
                {ACCENT_PRESETS.map((p) => {
                  const active = accent === p.name;
                  return (
                    <button
                      key={p.name}
                      onClick={() => setAccent(p.name)}
                      className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-lg transition-all"
                      style={{ background: active ? `${p.color}1f` : "rgba(255,255,255,0.02)", border: `1px solid ${active ? p.color : "rgba(148,163,184,0.2)"}` }}
                      title={p.name}
                    >
                      <span className="w-5 h-5 rounded-full grid place-items-center shrink-0" style={{ background: p.color, boxShadow: `0 0 10px ${p.color}88` }}>
                        {active && <Check size={12} color="#04040a" />}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: active ? p.color : "#94a3b8" }}>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* RGB Glow customizer */}
            <Section icon={<Sparkles size={14} />} title="RGB GLOW FRAME">
              <SubLabel>GLOW PRESET</SubLabel>
              <ChipRow options={GLOW_PRESETS} value={glow} onChange={setGlow} color={MAGENTA} />
              <SubLabel>ANIMATION SPEED</SubLabel>
              <ChipRow options={SPEEDS} value={speed} onChange={setSpeed} color={CYAN} />
              <SubLabel>AMBIENT INTENSITY</SubLabel>
              <ChipRow options={INTENSITIES} value={intensity} onChange={setIntensity} color={VIOLET} />
            </Section>

            {/* Sound & Notifications */}
            <Section icon={<Bell size={14} />} title="SOUND & NOTIFICATIONS">
              <div className="space-y-2">
                <ToggleRow icon={<Volume2 size={15} style={{ color: CYAN }} />} label="Notification sounds" on={notifSound} color={CYAN} onToggle={() => setNotifSound((v) => !v)} />
                <ToggleRow icon={<Keyboard size={15} style={{ color: VIOLET }} />} label="Keyboard typing sounds" on={typingSound} color={VIOLET} onToggle={() => setTypingSound((v) => !v)} />
                <ToggleRow icon={<Sparkles size={15} style={{ color: MAGENTA }} />} label="Dark base theme" on={darkMode} color={MAGENTA} onToggle={() => setDarkMode((v) => !v)} />
              </div>
            </Section>

            {/* Security */}
            <Section icon={<Shield size={14} />} title="SECURITY">
              <div className="px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.3)" }}>
                <div className="flex items-center gap-2.5">
                  <Shield size={16} style={{ color: "#4ade80" }} />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: "#e2e8f0" }}>End-to-End Encrypted</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: "#64748b" }}>256-bit AES-GCM · TLS 1.3 Strict</div>
                  </div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: "#4ade80" }}>ACTIVE</span>
              </div>
              <button className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl" style={{ color: "#ef2d56", border: "1px solid rgba(239,45,86,0.5)", fontFamily: MONO, fontSize: 12, background: "rgba(239,45,86,0.06)" }}>
                <LogOut size={15} /> SIGN OUT
              </button>
            </Section>
          </div>
        </div>
      </div>
      <style>{`@keyframes cyberflow{0%{background-position:0% 50%}100%{background-position:300% 50%}}`}</style>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3" style={{ color: VIOLET }}>
        {icon}
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em" }}>{title}</span>
        <div className="flex-1 h-px ml-2" style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.4), transparent)" }} />
      </div>
      {children}
    </section>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: MONO, fontSize: 10, color: "#64748b", margin: "10px 0 6px" }}>{children}</div>;
}

function ChipRow({ options, value, onChange, color }: { options: string[]; value: string; onChange: (v: string) => void; color: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className="px-3 py-1.5 rounded-lg transition-all"
            style={{ fontFamily: MONO, fontSize: 11, color: active ? "#04040a" : color, background: active ? color : "transparent", border: `1px solid ${color}`, boxShadow: active ? `0 0 12px ${color}88` : "none" }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({ icon, label, on, color, onToggle }: { icon: React.ReactNode; label: string; on: boolean; color: string; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(148,163,184,0.15)" }}>
      <div className="flex items-center gap-2.5">
        {icon}
        <span style={{ fontFamily: MONO, fontSize: 12, color: "#cbd5e1" }}>{label}</span>
      </div>
      <button onClick={onToggle} className="w-11 h-6 rounded-full relative transition-all" style={{ background: on ? color : "#334155", boxShadow: on ? `0 0 12px ${color}88` : "none" }}>
        <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ left: on ? 22 : 2, background: "#04040a" }} />
      </button>
    </div>
  );
}
