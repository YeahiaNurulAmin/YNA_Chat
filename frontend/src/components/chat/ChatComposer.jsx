import { Button, TextArea } from "@heroui/react";
import {
  ImageIcon,
  LoaderIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  SendHorizontalIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useKeyboardSound from "../../hooks/useKeyboardSound";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { MEDIA_ACCEPT } from "../../lib/media";
import { useChatStore } from "../../store/useChatStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import { Mic } from 'lucide-react';

const MIN_VOICE_DURATION_SECONDS = 1;

function formatRecordingTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function ChatComposer() {
  const composerText = useChatStore((state) => state.composerText);
  const isSoundEnabled = useChatStore((state) => state.isSoundEnabled);
  const sendMediaMessage = useChatStore((state) => state.sendMediaMessage);
  const sendVoiceMessage = useChatStore((state) => state.sendVoiceMessage);
  const isSendingMedia = useChatStore((state) => state.isSendingMedia);
  const sendTextMessage = useChatStore((state) => state.sendTextMessage);
  const setComposerText = useChatStore((state) => state.setComposerText);
  const { activeConversationId } = useSelectedConversation();
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const mediaInputRef = useRef(null);
  const previewAudioRef = useRef(null);
  const isHoldActiveRef = useRef(false);
  const skipHoldSendRef = useRef(false);
  const recordingModeRef = useRef(null);
  const prevConversationIdRef = useRef(activeConversationId);

  const [recordingMode, setRecordingMode] = useState(null);
  recordingModeRef.current = recordingMode;
  const [voicePreview, setVoicePreview] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

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

  const playSoundIfEnabled = () => {
    if (isSoundEnabled) playRandomKeyStrokeSound();
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

  const handleHoldPointerDown = async (event) => {
    if (isSendingMedia || isRecording || voicePreview) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    isHoldActiveRef.current = true;
    skipHoldSendRef.current = false;

    const started = await startRecording();
    if (!started) {
      isHoldActiveRef.current = false;
      toast.error("Microphone access is required to send voice messages");
      return;
    }

    setRecordingMode("hold");
  };

  const handleHoldPointerUp = async (event) => {
    if (!isHoldActiveRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isHoldActiveRef.current = false;

    if (skipHoldSendRef.current) {
      skipHoldSendRef.current = false;
      setRecordingMode(null);
      return;
    }

    const result = await stopRecording();
    applyRecordingResult(result, { sendImmediately: true });
  };

  const handleCancelHoldRecording = async () => {
    skipHoldSendRef.current = true;
    isHoldActiveRef.current = false;
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
  }, [activeConversationId, cancelRecording, resetVoiceSession, stopRecording]);

  return (
    <footer className="shrink-0 border-t border-border px-1.5 pb-2 pt-2 sm:px-2">
      {isSendingMedia ? (
        <div className="mx-auto mb-2 flex max-w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
          <LoaderIcon
            className="size-4 shrink-0 animate-spin text-accent"
            strokeWidth={2}
            aria-hidden
          />
          <span className="truncate">Sending...</span>
        </div>
      ) : null}

      {voicePreview ? (
        <div className="mx-auto flex w-full max-w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              isIconOnly
              size="sm"
              aria-label={isPreviewPlaying ? "Pause preview" : "Play preview"}
              className="size-9 min-w-9 shrink-0 text-accent"
              onPress={togglePreviewPlayback}
            >
              {isPreviewPlaying ? (
                <PauseIcon className="size-4" strokeWidth={2} />
              ) : (
                <PlayIcon className="size-4" strokeWidth={2} />
              )}
            </Button>
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                Voice preview
              </span>
              <span className="block truncate text-xs text-muted">
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
            <span className="text-sm tabular-nums text-muted">
              {formatRecordingTime(voicePreview.durationSeconds)}
            </span>
            <Button
              variant="ghost"
              isIconOnly
              size="sm"
              aria-label="Discard recording"
              className="size-8 min-w-8 text-muted"
              onPress={handleDiscardPreview}
            >
              <XIcon className="size-4" strokeWidth={2} />
            </Button>
            <Button
              variant="primary"
              size="sm"
              aria-label="Send voice message"
              className="h-8 gap-1.5 px-3"
              onPress={handleSendPreview}
            >
              <SendHorizontalIcon className="size-3.5" strokeWidth={2} />
              <span className="text-xs font-medium">Send</span>
            </Button>
          </div>
        </div>
      ) : isRecording ? (
        <div className="mx-auto flex w-full max-w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden />
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">Recording</span>
              <span className="block truncate text-xs text-muted">
                {recordingMode === "hold" ? "Release to send" : "Tap stop when finished"}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="text-sm tabular-nums text-muted">
              {formatRecordingTime(elapsedSeconds)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Cancel recording"
              className="h-8 gap-1.5 px-2.5 text-muted"
              onPress={
                recordingMode === "hold" ? handleCancelHoldRecording : handleCancelTapRecording
              }
            >
              <XIcon className="size-3.5" strokeWidth={2} />
              <span className="text-xs font-medium">Cancel</span>
            </Button>
            {recordingMode === "tap" ? (
              <Button
                variant="primary"
                size="sm"
                aria-label="Stop recording"
                className="h-8 gap-1.5 px-3"
                onPress={handleStopTapRecording}
              >
                <SquareIcon className="size-3.5 fill-current" strokeWidth={0} />
                <span className="text-xs font-medium">Stop</span>
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-full items-end gap-1.5 px-0.5 sm:gap-2 sm:px-1">
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
          <Button
            variant="ghost"
            isIconOnly
            isDisabled={isSendingMedia || isVoiceSessionActive}
            className="size-9 shrink-0 touch-manipulation self-end text-accent"
            onPress={() => mediaInputRef.current?.click()}
          >
            <ImageIcon className="size-5 sm:size-6" strokeWidth={2} />
          </Button>
          <TextArea
            fullWidth
            variant="secondary"
            placeholder="iMessage"
            rows={1}
            value={composerText}
            onChange={handleComposerTextChange}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 rounded-full"
          />

          {showVoiceButtons ? (
            <div className="flex shrink-0 items-end gap-1">
              <Button
                variant="primary"
                isDisabled={isSendingMedia}
                aria-label="Tap to record voice message"
                className="h-9 gap-1 px-2.5 sm:px-3"
                onPress={beginTapRecording}
              >
                <span className="text-xs font-medium leading-none"><Mic /></span>
              </Button>
            </div>
          ) : (
            <Button variant="primary" isIconOnly isDisabled={!hasText} onPress={handleSend}>
              <SendHorizontalIcon className="size-5" />
            </Button>
          )}
        </div>
      )}
    </footer>
  );
}
