/**
 * Overflow menu for chat header options (notifications, sounds, appearance).
 * Used in ChatHeader.
 */

import { useEffect, useRef, useState } from "react";
import { MoreVerticalIcon } from "lucide-react";
import { RgbCustomizer } from "../RgbCustomizer";
import { ThemePresetPicker } from "../ThemePresetPicker";
import { ThemeToggle } from "../ThemeToggle";
import { useChatStore } from "../../store/useChatStore";

export function ChatHeaderMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const isNotificationSoundEnabled = useChatStore((state) => state.isNotificationSoundEnabled);
  const isKeyboardSoundEnabled = useChatStore((state) => state.isKeyboardSoundEnabled);
  const setNotificationAlertsEnabled = useChatStore(
    (state) => state.setNotificationAlertsEnabled,
  );
  const setKeyboardSoundEnabled = useChatStore((state) => state.setKeyboardSoundEnabled);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="cyber-header-icon"
        aria-label="More options"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <MoreVerticalIcon className="size-4" strokeWidth={2} />
      </button>

      {isOpen ? (
        <div
          className="cyber-settings-menu"
          style={{ bottom: "auto", top: "calc(100% + 0.5rem)" }}
          role="menu"
        >
          <p className="cyber-settings-heading">Appearance</p>
          <div className="cyber-settings-tools">
            <RgbCustomizer />
            <ThemePresetPicker />
            <ThemeToggle />
          </div>
          <div className="cyber-settings-divider" />
          <button
            type="button"
            role="menuitem"
            className="cyber-settings-row"
            onClick={() => setNotificationAlertsEnabled(!isNotificationSoundEnabled)}
          >
            <span>Notification sounds</span>
            <span className={`cyber-settings-state ${isNotificationSoundEnabled ? "cyber-settings-state--on" : ""}`}>
              {isNotificationSoundEnabled ? "ON" : "OFF"}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="cyber-settings-row"
            onClick={() => setKeyboardSoundEnabled(!isKeyboardSoundEnabled)}
          >
            <span>Keyboard sounds</span>
            <span className={`cyber-settings-state ${isKeyboardSoundEnabled ? "cyber-settings-state--on" : ""}`}>
              {isKeyboardSoundEnabled ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
