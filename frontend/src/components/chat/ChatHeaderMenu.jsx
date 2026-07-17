/**
 * Overflow menu for the terminal header (notifications, sounds, appearance).
 * Used in ChatHeader when a conversation is active.
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
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <span className="label-tech text-[10px]">Appearance</span>
            <div className="flex items-center gap-0.5">
              <RgbCustomizer />
              <ThemePresetPicker />
              <ThemeToggle />
            </div>
          </div>
          <div className="my-1 h-px bg-white/8" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5"
            onClick={() => setNotificationAlertsEnabled(!isNotificationSoundEnabled)}
          >
            <span>Notification sounds</span>
            <span className="label-tech text-[10px]">
              {isNotificationSoundEnabled ? "ON" : "OFF"}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5"
            onClick={() => setKeyboardSoundEnabled(!isKeyboardSoundEnabled)}
          >
            <span>Keyboard sounds</span>
            <span className="label-tech text-[10px]">
              {isKeyboardSoundEnabled ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
