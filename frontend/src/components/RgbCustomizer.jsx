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
        <Button variant="ghost" size="sm" isIconOnly className="text-foreground">
          <Sparkles className="size-5 text-zinc-400 hover:text-white" />
        </Button>
      </Modal.Trigger>

      <Modal.Backdrop variant="opaque">
        <Modal.Container size="md" scroll="inside" placement="center">
          <Modal.Dialog className="max-h-[85dvh] border border-white/10 bg-[#2a2a2c] text-foreground shadow-2xl">
            <Modal.Header className="flex flex-row items-center justify-between gap-3 border-b border-white/10 pb-3">
              <Modal.Heading className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="size-5 text-accent" />
                RGB Glow Settings
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="isolate space-y-6 pt-4 pb-6">
              {/* Presets section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-300">Glow Preset</h3>
                <p className="text-xs text-zinc-400">
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
                          "relative flex flex-col items-center gap-2 rounded-xl p-2.5 text-center transition-all duration-200 outline-none cursor-pointer",
                          selected
                            ? "bg-white/10 ring-2 ring-accent ring-offset-2 ring-offset-[#2a2a2c]"
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
                            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md">
                              <Check className="size-3" strokeWidth={3} />
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={[
                            "text-[11px] font-medium leading-tight truncate max-w-full",
                            selected ? "text-white" : "text-zinc-400",
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
                <h3 className="text-sm font-semibold text-zinc-300">Animation Speed</h3>
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
                          "flex-1 border-white/10 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer",
                          selected ? "bg-accent text-accent-foreground" : "hover:bg-white/5"
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
                <h3 className="text-sm font-semibold text-zinc-300">Ambient Glow</h3>
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
                          "flex-1 border-white/10 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer",
                          selected ? "bg-accent text-accent-foreground" : "hover:bg-white/5"
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
