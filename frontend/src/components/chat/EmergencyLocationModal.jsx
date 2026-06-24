import { Button, Modal, useOverlayState } from "@heroui/react";
import { AlertTriangleIcon, LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FREQUENCY_PRESETS, parseFrequencyInput } from "../../lib/location";

function formatElapsedTime(startedAt) {
  if (!startedAt) return "0:00";
  const totalSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function EmergencyLocationModal({
  isOpen,
  onOpenChange,
  onStart,
  onStop,
  isActive,
  startedAt,
  sendCount,
  error,
}) {
  const modal = useOverlayState({
    isOpen,
    onOpenChange,
  });

  const [selectedPresetMs, setSelectedPresetMs] = useState(FREQUENCY_PRESETS[1].ms);
  const [customValue, setCustomValue] = useState("30");
  const [customUnit, setCustomUnit] = useState("seconds");
  const [useCustom, setUseCustom] = useState(false);
  const [elapsedLabel, setElapsedLabel] = useState("0:00");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isActive || !startedAt) return undefined;

    const updateElapsed = () => setElapsedLabel(formatElapsedTime(startedAt));
    updateElapsed();
    const timerId = setInterval(updateElapsed, 1000);
    return () => clearInterval(timerId);
  }, [isActive, startedAt]);

  const resolveIntervalMs = () => {
    if (!useCustom) return selectedPresetMs;

    const parsed = parseFrequencyInput(customValue, customUnit);
    if (!parsed.ok) {
      toast.error(parsed.message);
      return null;
    }

    return parsed.ms;
  };

  const handleStart = async () => {
    const intervalMs = resolveIntervalMs();
    if (!intervalMs || isStarting) return;

    setIsStarting(true);
    try {
      const started = await onStart({ intervalMs });
      if (started) {
        onOpenChange?.(false);
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    await onStop();
    onOpenChange?.(false);
  };

  return (
    <Modal.Root state={modal}>
      <Modal.Backdrop variant="opaque">
        <Modal.Container size="md" scroll="inside" placement="center">
          <Modal.Dialog className="max-h-[90dvh] border border-border bg-surface text-foreground shadow-2xl">
            <Modal.Header className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <Modal.Heading className="text-lg font-semibold">Emergency live location</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="space-y-5 pt-4">
              <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" strokeWidth={2} />
                <div className="space-y-1 text-foreground/90">
                  <p className="font-medium">For emergency use only</p>
                  <p className="text-muted">
                    Your browser will ask for location permission. Sharing continues best-effort in the
                    background — keep the app open for reliability.
                  </p>
                </div>
              </div>

              {isActive ? (
                <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm font-medium text-red-700">Live location is active</p>
                  <p className="text-sm text-muted">
                    Elapsed: {elapsedLabel} · {sendCount} ping{sendCount === 1 ? "" : "s"} sent
                  </p>
                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                  <Button variant="danger" className="w-full" onPress={handleStop}>
                    Stop sharing
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Update frequency</p>
                    <div className="flex flex-wrap gap-2">
                      {FREQUENCY_PRESETS.map((preset) => (
                        <Button
                          key={preset.ms}
                          size="sm"
                          variant={!useCustom && selectedPresetMs === preset.ms ? "primary" : "secondary"}
                          onPress={() => {
                            setUseCustom(false);
                            setSelectedPresetMs(preset.ms);
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Custom interval</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="number"
                        min="1"
                        value={customValue}
                        onChange={(event) => {
                          setUseCustom(true);
                          setCustomValue(event.target.value);
                        }}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        aria-label="Custom interval value"
                      />
                      <select
                        value={customUnit}
                        onChange={(event) => {
                          setUseCustom(true);
                          setCustomUnit(event.target.value);
                        }}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:w-36"
                        aria-label="Custom interval unit"
                      >
                        <option value="seconds">Seconds</option>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="ghost" isDisabled={isStarting} onPress={() => onOpenChange?.(false)}>
                      Cancel
                    </Button>
                    <Button variant="danger" isDisabled={isStarting} className="gap-2" onPress={handleStart}>
                      {isStarting ? (
                        <>
                          <LoaderIcon className="size-4 animate-spin" strokeWidth={2} aria-hidden />
                          Starting...
                        </>
                      ) : (
                        "Start sharing"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
