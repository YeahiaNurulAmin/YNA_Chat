/**
 * RGB frame preset, speed, and glow intensity picker.
 * Used in SidebarSettingsMenu, ChatHeaderMenu, AuthHeader, and AuthPage.
 */

import { Button, Modal, useOverlayState } from "@heroui/react";
import { Check, Sparkles } from "lucide-react";
import { useRgb } from "../context/RgbContext";
import { RGB_THEME_PRESETS, RGB_SPEEDS, RGB_INTENSITIES } from "../data/rgbPresets";

export function RgbCustomizer() {
  const modal = useOverlayState();
  const {
    rgbTheme,
    setRgbTheme,
    speed,
    setSpeed,
    glowIntensity,
    setGlowIntensity,
  } = useRgb();

  return (
    <Modal.Root state={modal}>
      <Modal.Trigger>
        <Button variant="ghost" size="sm" isIconOnly className="cyber-header-icon text-[var(--cl-glow-violet)]">
          <Sparkles className="size-4" />
        </Button>
      </Modal.Trigger>

      <Modal.Backdrop variant="opaque">
        <Modal.Container size="md" scroll="inside" placement="center">
          <Modal.Dialog className="glass-modal max-h-[85dvh] text-[var(--cl-on-surface)]">
            <Modal.Header className="rgb-accent-line cyber-modal-header flex flex-row items-center justify-between gap-3 pb-3">
              <Modal.Heading className="flex items-center gap-2 font-mono text-sm font-medium tracking-[0.14em] uppercase text-[var(--cl-glow-cyan)]">
                <Sparkles className="size-4 text-[var(--cl-glow-violet)]" />
                RGB Glow Settings
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="isolate space-y-6 pt-4 pb-6">
              {/* Presets section */}
              <div className="space-y-2">
                <h3 className="cyber-settings-heading px-0">Glow Preset</h3>
                <p className="text-xs text-[var(--cl-on-surface-variant)]">
                  Select a multi-color gradient theme for the outer border and glow:
                </p>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {RGB_THEME_PRESETS.map((p) => {
                    const selected = rgbTheme === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setRgbTheme(p.id)}
                        className={[
                          "relative flex flex-col items-center gap-2 rounded-lg p-2.5 text-center transition-all duration-200 outline-none cursor-pointer",
                          selected
                            ? "bg-[rgba(34,211,238,0.1)] ring-1 ring-[var(--cl-glow-cyan)]"
                            : "hover:bg-white/5",
                        ].join(" ")}
                        aria-pressed={selected}
                      >
                        <span className="relative">
                          <span
                            className="block size-12 shrink-0 rounded-full shadow-md ring-1 ring-white/20"
                            style={{ background: p.swatch }}
                          />

                          {selected ? (
                            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-[var(--cl-glow-cyan)] text-[#04040a] shadow-md">
                              <Check className="size-3" strokeWidth={3} />
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={[
                            "max-w-full truncate font-mono text-[11px] font-medium leading-tight",
                            selected ? "text-[var(--cl-glow-cyan)]" : "text-[var(--cl-outline)]",
                          ].join(" ")}
                        >
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Speed Section */}
              <div className="space-y-2">
                <h3 className="cyber-settings-heading px-0">Animation Speed</h3>
                <div className="flex gap-2">
                  {RGB_SPEEDS.map((s) => {
                    const selected = speed === s.id;
                    return (
                      <Button
                        key={s.id}
                        size="sm"
                        variant={selected ? "solid" : "bordered"}
                        color={selected ? "primary" : "default"}
                        className={[
                          "flex-1 cursor-pointer rounded-md border-[var(--cl-glow-cyan)] font-mono text-[11px] font-medium transition-colors",
                          selected
                            ? "bg-[var(--cl-glow-cyan)] text-[#04040a] shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                            : "bg-transparent text-[var(--cl-glow-cyan)] hover:bg-[rgba(34,211,238,0.08)]",
                        ].join(" ")}
                        onClick={() => setSpeed(s.id)}
                      >
                        {s.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Glow Intensity Section */}
              <div className="space-y-2">
                <h3 className="cyber-settings-heading px-0">Ambient Glow</h3>
                <div className="flex gap-2">
                  {RGB_INTENSITIES.map((i) => {
                    const selected = glowIntensity === i.id;
                    return (
                      <Button
                        key={i.id}
                        size="sm"
                        variant={selected ? "solid" : "bordered"}
                        color={selected ? "primary" : "default"}
                        className={[
                          "flex-1 cursor-pointer rounded-md border-[var(--cl-glow-violet)] font-mono text-[11px] font-medium transition-colors",
                          selected
                            ? "bg-[var(--cl-glow-violet)] text-[#04040a] shadow-[0_0_12px_rgba(139,92,246,0.45)]"
                            : "bg-transparent text-[var(--cl-glow-violet)] hover:bg-[rgba(139,92,246,0.08)]",
                        ].join(" ")}
                        onClick={() => setGlowIntensity(i.id)}
                      >
                        {i.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
