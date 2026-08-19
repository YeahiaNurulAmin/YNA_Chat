import { Button } from "@heroui/react";
import {
  ChevronDownIcon,
  ImageIcon,
  LoaderIcon,
  MapPinIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SendHorizontalIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useKeyboardSound from "../../hooks/useKeyboardSound";
import { useEmergencyLocationSession } from "../../hooks/useEmergencyLocationSession";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import { MEDIA_ACCEPT } from "../../lib/media";
import { useChatStore } from "../../store/useChatStore";
import { EmergencyLocationModal } from "./EmergencyLocationModal";
import { LocationPickerModal } from "./LocationPickerModal";
import { TerminalMetadata } from "./TerminalMetadata";

const MIN_VOICE_DURATION_SECONDS = 1;
const LOCATION_LONG_PRESS_MS = 500;

function formatRecordingTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatElapsedTime(startedAt) {
  if (!startedAt) return "0:00";

  const totalSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function ChatComposer() {
  const composerText = useChatStore((state) => state.composerText);
  const isKeyboardSoundEnabled = useChatStore((state) => state.isKeyboardSoundEnabled);
  const sendMediaMessage = useChatStore((state) => state.sendMediaMessage);
  const sendVoiceMessage = useChatStore((state) => state.sendVoiceMessage);
  const sendLocationMessage = useChatStore((state) => state.sendLocationMessage);
  const isSendingMedia = useChatStore((state) => state.isSendingMedia);
  const isSendingLocation = useChatStore((state) => state.isSendingLocation);
  const sendTextMessage = useChatStore((state) => state.sendTextMessage);
  const isSendingText = useChatStore((state) => state.isSendingText);
  const replyingTo = useChatStore((state) => state.replyingTo);
  const clearReplyingTo = useChatStore((state) => state.clearReplyingTo);
  const setComposerText = useChatStore((state) => state.setComposerText);
  const { activeConversationId } = useSelectedConversation();
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const mediaInputRef = useRef(null);
  const previewAudioRef = useRef(null);
  const isHoldActiveRef = useRef(false);
  const skipHoldSendRef = useRef(false);
  const recordingModeRef = useRef(null);
  const prevConversationIdRef = useRef(activeConversationId);
  const locationLongPressRef = useRef(null);
  const locationLongPressTriggeredRef = useRef(false);

  const [recordingMode, setRecordingMode] = useState(null);
  const [voicePreview, setVoicePreview] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [elapsedTick, setElapsedTick] = useState(0);

  const {
    isActive: isEmergencyActive,
    startedAt: emergencyStartedAt,
    sendCount: emergencySendCount,
    start: startEmergencySession,
    stop: stopEmergencySession,
  } = useEmergencyLocationSession(activeConversationId);

  const {
    isSupported: isVoiceSupported,
    isRecording,
    elapsedSeconds,
    startRecording,
    stopRecording,
    cancelRecording,
    setOnMaxDuration,
  } = useVoiceRecorder();

  const hasText = composerText.trim().length > 0;
  const showVoiceButtons = !hasText && isVoiceSupported && !voicePreview;
  const isVoiceSessionActive = isRecording || voicePreview;
  const isLocationLoading = isSendingLocation;
  const isLocationButtonDisabled =
    isSendingMedia || isLocationLoading || isVoiceSessionActive || isEmergencyActive;

  const elapsedLabel =
    isEmergencyActive && emergencyStartedAt ? formatElapsedTime(emergencyStartedAt) : "0:00";
  void elapsedTick;

  const playSoundIfEnabled = () => {
    if (isKeyboardSoundEnabled) playRandomKeyStrokeSound();
  };

  const clearVoicePreview = useCallback(() => {
    previewAudioRef.current?.pause();
    setIsPreviewPlaying(false);
    setVoicePreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  const resetVoiceSession = useCallback(() => {
    setRecordingMode(null);
    isHoldActiveRef.current = false;
    skipHoldSendRef.current = false;
    clearVoicePreview();
  }, [clearVoicePreview]);

  const clearLocationLongPress = useCallback(() => {
    if (locationLongPressRef.current != null) {
      clearTimeout(locationLongPressRef.current);
      locationLongPressRef.current = null;
    }
  }, []);

  const applyRecordingResult = useCallback(
    (result, { sendImmediately = false } = {}) => {
      if (!result) return;

      if (result.durationSeconds < MIN_VOICE_DURATION_SECONDS) {
        toast.error("Recording too short");
        return;
      }

      if (sendImmediately) {
        void sendVoiceMessage({
          conversationId: activeConversationId,
          blob: result.blob,
          extension: result.extension,
        }).then((didSend) => {
          if (didSend) playSoundIfEnabled();
        });
        resetVoiceSession();
        return;
      }

      const url = URL.createObjectURL(result.blob);
      setVoicePreview({
        blob: result.blob,
        extension: result.extension,
        durationSeconds: result.durationSeconds,
        url,
      });
      setRecordingMode(null);
    },
    [activeConversationId, resetVoiceSession, sendVoiceMessage],
  );

  const handleSend = async () => {
    if (isSendingText || !hasText) return;

    const didSendMessage = await sendTextMessage(activeConversationId);
    if (didSendMessage) playSoundIfEnabled();
  };

  const handleComposerTextChange = (event) => {
    setComposerText(event.target.value);
    playSoundIfEnabled();
  };

  const handleMediaPick = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const didSendMessage = await sendMediaMessage({
      conversationId: activeConversationId,
      files,
    });

    if (didSendMessage) playSoundIfEnabled();
  };

  const handleSendPickedLocation = async (location) => {
    if (!activeConversationId) return false;

    const didSend = await sendLocationMessage({
      conversationId: activeConversationId,
      location,
    });

    if (didSend) playSoundIfEnabled();
    return didSend;
  };

  const handleOpenLocationPicker = () => {
    if (isLocationButtonDisabled) return;
    setIsLocationPickerOpen(true);
  };

  const handleLocationPointerDown = () => {
    if (isLocationButtonDisabled) return;

    locationLongPressTriggeredRef.current = false;
    clearLocationLongPress();
    locationLongPressRef.current = setTimeout(() => {
      locationLongPressTriggeredRef.current = true;
      setIsEmergencyModalOpen(true);
      locationLongPressRef.current = null;
    }, LOCATION_LONG_PRESS_MS);
  };

  const handleLocationPointerUp = () => {
    const wasLongPress = locationLongPressTriggeredRef.current;
    clearLocationLongPress();

    if (!wasLongPress && !isLocationButtonDisabled) {
      handleOpenLocationPicker();
    }
  };

  const handleStartEmergencySession = async ({ intervalMs }) => {
    if (!activeConversationId) return false;
    return startEmergencySession({
      conversationId: activeConversationId,
      intervalMs,
    });
  };

  const handleStopEmergencySession = async () => {
    await stopEmergencySession();
  };

  const beginTapRecording = async () => {
    if (isSendingMedia || isRecording || voicePreview) return;

    const started = await startRecording();
    if (!started) {
      toast.error("Microphone access is required to send voice messages");
      return;
    }

    setRecordingMode("tap");
  };

  const handleStopTapRecording = async () => {
    const result = await stopRecording();
    applyRecordingResult(result);
  };

  const handleCancelTapRecording = async () => {
    cancelRecording();
    await stopRecording();
    setRecordingMode(null);
  };

  const handleSendPreview = async () => {
    if (!voicePreview) return;

    const didSendMessage = await sendVoiceMessage({
      conversationId: activeConversationId,
      blob: voicePreview.blob,
      extension: voicePreview.extension,
    });

    if (didSendMessage) playSoundIfEnabled();
    resetVoiceSession();
  };

  const handleDiscardPreview = () => {
    resetVoiceSession();
  };

  const togglePreviewPlayback = async () => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPreviewPlaying(true);
    } catch (error) {
      console.error("Preview playback failed:", error);
      toast.error("Could not play recording");
    }
  };

  useEffect(() => {
    recordingModeRef.current = recordingMode;
  }, [recordingMode]);

  useEffect(() => {
    setOnMaxDuration(async () => {
      if (recordingModeRef.current === "hold") {
        const result = await stopRecording();
        applyRecordingResult(result, { sendImmediately: true });
        return;
      }

      const result = await stopRecording();
      applyRecordingResult(result);
    });
  }, [applyRecordingResult, setOnMaxDuration, stopRecording]);

  useEffect(() => {
    return () => {
      if (voicePreview?.url) URL.revokeObjectURL(voicePreview.url);
    };
  }, [voicePreview]);

  useEffect(() => {
    if (prevConversationIdRef.current === activeConversationId) return;
    prevConversationIdRef.current = activeConversationId;

    resetVoiceSession();
    cancelRecording();
    void stopRecording();
    setIsEmergencyModalOpen(false);
    setIsLocationPickerOpen(false);
    clearReplyingTo();
  }, [activeConversationId, cancelRecording, clearReplyingTo, resetVoiceSession, stopRecording]);

  useEffect(() => {
    if (!isEmergencyActive || !emergencyStartedAt) return undefined;

    const timerId = setInterval(() => setElapsedTick((tick) => tick + 1), 1000);
    return () => clearInterval(timerId);
  }, [emergencyStartedAt, isEmergencyActive]);

  useEffect(() => () => clearLocationLongPress(), [clearLocationLongPress]);

  if (!activeConversationId) {
    return (
      <footer className="composer-glass">
        <TerminalMetadata />
        <div className="composer-input-wrap composer-input-wrap--disabled">
          <button type="button" className="cyber-composer-btn" disabled aria-hidden>
            <PlusIcon className="size-5" strokeWidth={2} />
          </button>
          <textarea
            className="cyber-composer-textarea"
            placeholder="Transmit message..."
            disabled
            rows={1}
            readOnly
          />
          <button type="button" className="cyber-composer-btn" disabled aria-hidden>
            <ImageIcon className="size-5" strokeWidth={2} />
          </button>
          <button type="button" className="cyber-send-btn" disabled aria-hidden>
            <SendHorizontalIcon className="size-4" strokeWidth={2.25} />
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer className="composer-glass">
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        onSend={handleSendPickedLocation}
        isSending={isSendingLocation}
      />

      <EmergencyLocationModal
        isOpen={isEmergencyModalOpen}
        onOpenChange={setIsEmergencyModalOpen}
        onStart={handleStartEmergencySession}
        onStop={handleStopEmergencySession}
        isActive={isEmergencyActive}
        startedAt={emergencyStartedAt}
        sendCount={emergencySendCount}
      />

      {isSendingMedia ? (
        <div className="composer-status-banner">
          <LoaderIcon
            className="size-4 shrink-0 animate-spin text-[var(--cl-glow-cyan)]"
            strokeWidth={2}
            aria-hidden
          />
          <span className="truncate">Sending...</span>
        </div>
      ) : null}

      {isLocationLoading && !isEmergencyActive ? (
        <div className="composer-status-banner">
          <LoaderIcon
            className="size-4 shrink-0 animate-spin text-[var(--cl-glow-cyan)]"
            strokeWidth={2}
            aria-hidden
          />
          <span className="truncate">Getting location...</span>
        </div>
      ) : null}

      {isEmergencyActive ? (
        <div className="composer-status-banner composer-status-banner--alert">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="size-2.5 shrink-0 animate-pulse rounded-full bg-[var(--cl-status-alert)]"
              aria-hidden
            />
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-[var(--cl-status-alert)]">
                Live location active
              </span>
              <span className="block truncate text-xs text-[var(--cl-on-surface-variant)]">
                {elapsedLabel} · {emergencySendCount} update{emergencySendCount === 1 ? "" : "s"} ·
                best-effort — keep app open
              </span>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            aria-label="Stop live location sharing"
            className="h-8 shrink-0 px-3"
            onPress={handleStopEmergencySession}
          >
            Stop
          </Button>
        </div>
      ) : null}

      <TerminalMetadata />

      {voicePreview ? (
        <div className="composer-session-card">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="cyber-composer-btn text-[var(--cl-glow-cyan)]"
              aria-label={isPreviewPlaying ? "Pause preview" : "Play preview"}
              onClick={() => void togglePreviewPlayback()}
            >
              {isPreviewPlaying ? (
                <PauseIcon className="size-4" strokeWidth={2} />
              ) : (
                <PlayIcon className="size-4" strokeWidth={2} />
              )}
            </button>
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-[var(--cl-on-surface)]">
                Voice preview
              </span>
              <span className="block truncate text-xs text-[var(--cl-on-surface-variant)]">
                Listen, then send or cancel
              </span>
            </div>
            <audio
              ref={previewAudioRef}
              src={voicePreview.url}
              preload="metadata"
              className="hidden"
              onEnded={() => setIsPreviewPlaying(false)}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="caption-tabular">
              {formatRecordingTime(voicePreview.durationSeconds)}
            </span>
            <button
              type="button"
              className="cyber-composer-btn"
              aria-label="Discard recording"
              onClick={handleDiscardPreview}
            >
              <XIcon className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              className="cyber-btn-primary h-8 gap-1.5 px-3 text-xs"
              aria-label="Send voice message"
              onClick={() => void handleSendPreview()}
            >
              <SendHorizontalIcon className="size-3.5" strokeWidth={2} />
              Send
            </button>
          </div>
        </div>
      ) : isRecording ? (
        <div className="composer-session-card composer-session-card--alert">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="size-2.5 shrink-0 animate-pulse rounded-full bg-[var(--cl-status-alert)]"
              aria-hidden
            />
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-[var(--cl-on-surface)]">
                Recording
              </span>
              <span className="block truncate text-xs text-[var(--cl-on-surface-variant)]">
                Tap stop when finished
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="caption-tabular">{formatRecordingTime(elapsedSeconds)}</span>
            <button
              type="button"
              className="cyber-composer-btn h-8 gap-1.5 px-2.5 text-xs"
              aria-label="Cancel recording"
              onClick={() => void handleCancelTapRecording()}
            >
              <XIcon className="size-3.5" strokeWidth={2} />
              Cancel
            </button>
            {recordingMode === "tap" ? (
              <button
                type="button"
                className="cyber-btn-primary h-8 gap-1.5 px-3 text-xs"
                aria-label="Stop recording"
                onClick={() => void handleStopTapRecording()}
              >
                <SquareIcon className="size-3.5 fill-current" strokeWidth={0} />
                Stop
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-full flex-col gap-2">
          {replyingTo ? (
            <div className="composer-reply-bar">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--cl-glow-cyan)]">
                  Replying to {replyingTo.senderName}
                </p>
                <p className="truncate text-sm text-[var(--cl-on-surface-variant)]">
                  {replyingTo.text}
                </p>
              </div>
              <button
                type="button"
                className="cyber-composer-btn shrink-0"
                aria-label="Cancel reply"
                onClick={clearReplyingTo}
              >
                <XIcon className="size-4" strokeWidth={2} />
              </button>
            </div>
          ) : null}

          <div className="composer-input-wrap flex w-full items-center gap-1">
            <input
              ref={mediaInputRef}
              type="file"
              accept={MEDIA_ACCEPT}
              multiple
              className="sr-only"
              disabled={isSendingMedia || isVoiceSessionActive}
              tabIndex={-1}
              aria-hidden
              onChange={handleMediaPick}
            />
            <button
              type="button"
              className="cyber-composer-btn"
              disabled={isSendingMedia || isVoiceSessionActive}
              aria-label="Attach files"
              onClick={() => mediaInputRef.current?.click()}
            >
              <PlusIcon className="size-5" strokeWidth={2} />
            </button>

            <textarea
              className="cyber-composer-textarea"
              placeholder="Transmit message..."
              rows={1}
              value={composerText}
              disabled={isSendingText}
              onChange={handleComposerTextChange}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
            />

            <button
              type="button"
              className="cyber-composer-btn"
              disabled={isSendingMedia || isVoiceSessionActive}
              aria-label="Attach media"
              onClick={() => mediaInputRef.current?.click()}
            >
              <ImageIcon className="size-5" strokeWidth={2} />
            </button>

            <div className="flex shrink-0 items-center">
              <button
                type="button"
                className="cyber-composer-btn"
                disabled={isLocationButtonDisabled}
                aria-label="Send location. Long press for emergency live sharing."
                onPointerDown={handleLocationPointerDown}
                onPointerUp={handleLocationPointerUp}
                onPointerLeave={clearLocationLongPress}
                onPointerCancel={clearLocationLongPress}
              >
                {isLocationLoading ? (
                  <LoaderIcon className="size-5 animate-spin" strokeWidth={2} />
                ) : (
                  <MapPinIcon className="size-5" strokeWidth={2} />
                )}
              </button>
              <button
                type="button"
                className="cyber-composer-btn size-8 min-w-8"
                disabled={isLocationButtonDisabled}
                aria-label="Emergency live location"
                onClick={() => setIsEmergencyModalOpen(true)}
              >
                <ChevronDownIcon className="size-4" strokeWidth={2} />
              </button>
            </div>

            {showVoiceButtons ? (
              <button
                type="button"
                className="cyber-composer-btn text-[var(--cl-glow-cyan)]"
                disabled={isSendingMedia}
                aria-label="Tap to record voice message"
                onClick={beginTapRecording}
              >
                <MicIcon className="size-5" strokeWidth={2} />
              </button>
            ) : (
              <button
                type="button"
                className="cyber-send-btn"
                disabled={!hasText || isSendingText}
                aria-label={isSendingText ? "Sending message" : "Send message"}
                onClick={() => void handleSend()}
              >
                {isSendingText ? (
                  <LoaderIcon className="size-4 animate-spin" strokeWidth={2} aria-hidden />
                ) : (
                  <SendHorizontalIcon className="size-4" strokeWidth={2.25} />
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
