/**
 * HeroUI accent-theme preset picker.
 * Used in SidebarSettingsMenu, ChatHeaderMenu, AuthHeader, and AuthPage.
 */

import { Button, Modal, useOverlayState } from "@heroui/react";
import { Check, Palette } from "lucide-react";
import { applyThemePresetToDocument, useTheme } from "../context/theme";
import { HERO_UI_THEME_PRESETS } from "../data/herouiThemePresets";

export function ThemePresetPicker() {
  const modal = useOverlayState();
  const { themePreset, setThemePreset } = useTheme();

  const handleSelect = (id) => {
    applyThemePresetToDocument(id);
    setThemePreset(id);
    modal.close();
  };

  return (
    <Modal.Root state={modal}>
      <Modal.Trigger>
        <Button variant="ghost" size="sm" isIconOnly className="cyber-header-icon text-[var(--cl-glow-violet)]">
          <Palette className="size-4" />
        </Button>
      </Modal.Trigger>

      <Modal.Backdrop variant="opaque">
        <Modal.Container size="md" scroll="inside" placement="center">
          <Modal.Dialog className="glass-modal max-h-[85dvh] text-[var(--cl-on-surface)]">
            <Modal.Header className="rgb-accent-line cyber-modal-header flex flex-row items-center justify-between gap-3 pb-3">
              <Modal.Heading className="font-mono text-sm font-medium tracking-[0.14em] uppercase text-[var(--cl-glow-cyan)]">
                Accent theme
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="isolate pt-4">
              <p className="mb-4 text-sm text-[var(--cl-on-surface-variant)]">
                HeroUI components use the accent color for primary actions and focus.
              </p>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                {HERO_UI_THEME_PRESETS.map((p) => {
                  const selected = themePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect(p.id)}
                      className={[
                        "relative flex flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors",
                        selected
                          ? "bg-[rgba(34,211,238,0.1)] ring-1 ring-[var(--cl-glow-cyan)]"
                          : "hover:bg-[var(--cl-wash-1)]",
                      ].join(" ")}
                      aria-pressed={selected}
                    >
                      <span className="relative">
                        <span
                          className="block size-14 shrink-0 rounded-full shadow-md ring-1 ring-white/20"
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
                          "font-mono text-[11px] font-medium leading-tight",
                          selected ? "text-[var(--cl-glow-cyan)]" : "text-[var(--cl-outline)]",
                        ].join(" ")}
                      >
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
