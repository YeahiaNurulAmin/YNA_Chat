/**
 * Full settings page — profile, accent theme, RGB glow frame, sound toggles,
 * and security. Opened from the sidebar gear / header menu inside ChatPage.
 */

import { useEffect } from "react";
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
import { useClerk } from "@clerk/react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useRgb } from "../../context/RgbContext";
import { applyThemePresetToDocument, useTheme } from "../../context/theme";
import { HERO_UI_THEME_PRESETS } from "../../data/herouiThemePresets";
import { RGB_THEME_PRESETS, RGB_SPEEDS, RGB_INTENSITIES } from "../../data/rgbPresets";
import { getInitials } from "../../hooks/useSelectedConversation";

export function SettingsPage() {
  const setSettingsOpen = useChatStore((state) => state.setSettingsOpen);

  const isNotificationSoundEnabled = useChatStore((state) => state.isNotificationSoundEnabled);
  const isKeyboardSoundEnabled = useChatStore((state) => state.isKeyboardSoundEnabled);
  const setNotificationAlertsEnabled = useChatStore(
    (state) => state.setNotificationAlertsEnabled,
  );
  const setKeyboardSoundEnabled = useChatStore((state) => state.setKeyboardSoundEnabled);

  const authUser = useAuthStore((state) => state.authUser);

  const { theme, setTheme, themePreset, setThemePreset } = useTheme();
  const { rgbTheme, setRgbTheme, speed, setSpeed, glowIntensity, setGlowIntensity } = useRgb();

  const clerk = useClerk();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setSettingsOpen]);

  const avatarUrl = authUser?.profilePic ?? authUser?.profilePicture;
  const initials = getInitials(authUser?.fullName ?? "");

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <button
          type="button"
          className="settings-page__back"
          aria-label="Back to chat"
          onClick={() => setSettingsOpen(false)}
        >
          <ChevronLeft className="size-4" strokeWidth={2} />
        </button>
        <div>
          <p className="settings-page__title">Settings</p>
          <p className="settings-page__subtitle">System configuration</p>
        </div>
      </header>

      <div className="settings-page__body">
        {/* Profile */}
        <section>
          <div className="settings-section__title">
            <UserIcon className="size-3.5" strokeWidth={2} aria-hidden />
            <span>Profile</span>
          </div>
          <div className="settings-card settings-card--row">
            <div className="settings-profile-avatar">
              <div className="settings-profile-avatar__inner">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="font-mono text-lg text-[var(--cl-glow-cyan)]">{initials}</span>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[15px] text-[var(--cl-on-surface)]">
                {authUser?.fullName}
              </p>
              <p className="truncate text-xs text-[var(--cl-on-surface-variant)]">
                {authUser?.email}
              </p>
            </div>
            <button type="button" className="settings-edit-btn">
              Edit
            </button>
          </div>
        </section>

        {/* Accent theme */}
        <section>
          <div className="settings-section__title">
            <Palette className="size-3.5" strokeWidth={2} aria-hidden />
            <span>Accent theme</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {HERO_UI_THEME_PRESETS.map((preset) => {
              const selected = themePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    applyThemePresetToDocument(preset.id);
                    setThemePreset(preset.id);
                  }}
                  className="settings-accent-chip"
                  style={{
                    background: selected
                      ? `${preset.swatch}1f`
                      : "var(--cl-wash-1)",
                    borderColor: selected ? preset.swatch : "rgba(148,163,184,0.2)",
                  }}
                  aria-pressed={selected}
                >
                  <span
                    className="settings-accent-chip__dot"
                    style={{ background: preset.swatch, boxShadow: `0 0 10px ${preset.swatch}88` }}
                  >
                    {selected ? <Check className="size-3 text-[#04040a]" strokeWidth={3} /> : null}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--cl-outline)]">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* RGB glow frame */}
        <section>
          <div className="settings-section__title">
            <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
            <span>RGB glow frame</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="settings-sub-label">Glow preset</p>
              <div className="flex flex-wrap gap-2">
                {RGB_THEME_PRESETS.map((preset) => (
                  <ChipButton
                    key={preset.id}
                    active={rgbTheme === preset.id}
                    color="var(--cl-glow-magenta)"
                    onClick={() => setRgbTheme(preset.id)}
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: preset.swatch }}
                    />
                    {preset.label}
                  </ChipButton>
                ))}
              </div>
            </div>
            <div>
              <p className="settings-sub-label">Animation speed</p>
              <div className="flex flex-wrap gap-2">
                {RGB_SPEEDS.map((option) => (
                  <ChipButton
                    key={option.id}
                    active={speed === option.id}
                    color="var(--cl-glow-cyan)"
                    onClick={() => setSpeed(option.id)}
                  >
                    {option.label}
                  </ChipButton>
                ))}
              </div>
            </div>
            <div>
              <p className="settings-sub-label">Ambient glow</p>
              <div className="flex flex-wrap gap-2">
                {RGB_INTENSITIES.map((option) => (
                  <ChipButton
                    key={option.id}
                    active={glowIntensity === option.id}
                    color="var(--cl-glow-violet)"
                    onClick={() => setGlowIntensity(option.id)}
                  >
                    {option.label}
                  </ChipButton>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sound & notifications */}
        <section>
          <div className="settings-section__title">
            <Bell className="size-3.5" strokeWidth={2} aria-hidden />
            <span>Sound & notifications</span>
          </div>
          <div className="space-y-2">
            <ToggleRow
              icon={<Volume2 className="size-4 text-[var(--cl-glow-cyan)]" />}
              label="Notification sounds"
              on={isNotificationSoundEnabled}
              color="var(--cl-glow-cyan)"
              onToggle={() => setNotificationAlertsEnabled(!isNotificationSoundEnabled)}
            />
            <ToggleRow
              icon={<Keyboard className="size-4 text-[var(--cl-glow-violet)]" />}
              label="Keyboard typing sounds"
              on={isKeyboardSoundEnabled}
              color="var(--cl-glow-violet)"
              onToggle={() => setKeyboardSoundEnabled(!isKeyboardSoundEnabled)}
            />
            <ToggleRow
              icon={<Sparkles className="size-4 text-[var(--cl-glow-magenta)]" />}
              label="Dark base theme"
              on={theme === "dark"}
              color="var(--cl-glow-magenta)"
              onToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
            />
          </div>
        </section>

        {/* Security */}
        <section>
          <div className="settings-section__title">
            <Shield className="size-3.5" strokeWidth={2} aria-hidden />
            <span>Security</span>
          </div>
          <div className="settings-security-row">
            <Shield className="size-4 shrink-0 text-[var(--cl-status-online)]" />
            <div>
              <p className="font-mono text-xs text-[var(--cl-on-surface)]">
                End-to-End Encrypted
              </p>
              <p className="font-mono text-[10px] text-[var(--cl-on-surface-variant)]">
                256-bit AES-GCM · TLS 1.3 Strict
              </p>
            </div>
            <span className="settings-security-row__badge">Active</span>
          </div>
          <button
            type="button"
            className="settings-signout-btn"
            onClick={() => {
              setSettingsOpen(false);
              clerk.signOut();
            }}
          >
            <LogOut className="size-4" strokeWidth={2} />
            Sign out
          </button>
        </section>
      </div>
    </div>
  );
}

function ChipButton({ active, color, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="settings-chip"
      style={{
        background: active ? color : "transparent",
        borderColor: color,
        color: active ? "#04040a" : color,
        boxShadow: active ? `0 0 12px ${color}88` : "none",
      }}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function ToggleRow({ icon, label, on, color, onToggle }) {
  return (
    <div className="settings-toggle-row">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="font-mono text-xs text-[var(--cl-on-surface-variant)]">{label}</span>
      </div>
      <button
        type="button"
        className="settings-toggle-track"
        style={{ background: on ? color : "#334155", boxShadow: on ? `0 0 12px ${color}88` : "none" }}
        aria-checked={on}
        role="switch"
        onClick={onToggle}
      >
        <span className="settings-toggle-knob" style={{ left: on ? 22 : 2 }} />
      </button>
    </div>
  );
}