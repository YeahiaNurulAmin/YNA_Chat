import { Avatar, Modal, useOverlayState } from "@heroui/react";
import {
  LoaderIcon,
  LockIcon,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  PhoneOffIcon,
  PhoneIncomingIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useIncomingRingtone, useOutgoingRingback } from "../../hooks/useCallSounds";
import { CallControl } from "./CallControl";

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const STATUS_LABEL = {
  outgoing: "Ringing",
  incoming: "Incoming Call",
  connecting: "Connecting",
  active: "In Call",
  missed: "Call Ended",
};

export function AudioCallModal() {
  const status = useCallStore((state) => state.status);
  const callType = useCallStore((state) => state.callType);
  const peer = useCallStore((state) => state.peer);
  const isMuted = useCallStore((state) => state.isMuted);
  const isSpeakerOn = useCallStore((state) => state.isSpeakerOn);
  const callDurationSeconds = useCallStore((state) => state.callDurationSeconds);
  const acceptCall = useCallStore((state) => state.acceptCall);
  const rejectCall = useCallStore((state) => state.rejectCall);
  const cancelCall = useCallStore((state) => state.cancelCall);
  const endCall = useCallStore((state) => state.endCall);
  const reset = useCallStore((state) => state.reset);
  const toggleMute = useCallStore((state) => state.toggleMute);
  const toggleSpeaker = useCallStore((state) => state.toggleSpeaker);
  const isMinimized = useCallStore((state) => state.isMinimized);
  const minimizeCall = useCallStore((state) => state.minimizeCall);

  const isAudio = callType === "audio";
  const isOpen = isAudio && !isMinimized && ["outgoing", "incoming", "connecting", "active", "missed"].includes(status);

  const modal = useOverlayState({
    isOpen,
    onOpenChange: (open) => {
      if (open) return;
      if (["outgoing", "incoming", "connecting", "active"].includes(status)) {
        minimizeCall();
      } else if (status === "missed") {
        reset();
      }
    },
  });

  useIncomingRingtone(isAudio && status === "incoming");
  useOutgoingRingback(isAudio && status === "outgoing");

  if (!isAudio) return null;

  const ringing = status === "outgoing" || status === "incoming" || status === "connecting";

  const statusText =
    status === "active" ? formatDuration(callDurationSeconds) : STATUS_LABEL[status] ?? "";

  return (
    <Modal state={modal}>
      <Modal.Backdrop variant="opaque">
        <Modal.Container size="full">
          <Modal.Dialog className="glass-modal cyber-call-overlay">
            <Modal.Header className="cyber-call-topbar">
              <div className="cyber-call-secure">
                <LockIcon className="size-3" strokeWidth={2} />
                End-to-end encrypted
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="cyber-call-body">
              {peer ? (
                <div className="cyber-call-avatar-stage">
                  {ringing ? (
                    <>
                      <span className="cyber-call-pulse cyber-call-pulse--one" aria-hidden />
                      <span className="cyber-call-pulse cyber-call-pulse--two" aria-hidden />
                      <span className="cyber-call-pulse cyber-call-pulse--three" aria-hidden />
                    </>
                  ) : null}
                  <div className="avatar-neon-ring rounded-full">
                    <Avatar className="size-28">
                      <Avatar.Image alt={peer.name} src={peer.avatarUrl} />
                      <Avatar.Fallback className="text-2xl font-semibold">{peer.initials}</Avatar.Fallback>
                    </Avatar>
                  </div>
                  <span
                    className={`cyber-call-presence${ringing ? " cyber-call-presence--ringing" : ""}`}
                    aria-hidden
                  />
                </div>
              ) : null}

              <p className="cyber-call-name">{peer?.name ?? "Voice call"}</p>

              <div className="cyber-call-status-row">
                {status === "connecting" ? (
                  <span className="cyber-call-connecting">
                    <LoaderIcon className="size-4 animate-spin" strokeWidth={2} />
                    Connecting to encrypted stream
                  </span>
                ) : (
                  <span className="cyber-call-status-chip">{statusText}</span>
                )}
              </div>
            </Modal.Body>

            <Modal.Footer className="cyber-call-controls">
              {status === "outgoing" ? (
                <CallControl
                  icon={<PhoneOffIcon className="size-5" strokeWidth={2} />}
                  label="Cancel"
                  tone="end"
                  onPress={cancelCall}
                />
              ) : null}

              {status === "incoming" ? (
                <>
                  <CallControl
                    icon={<PhoneOffIcon className="size-5" strokeWidth={2} />}
                    label="Decline"
                    tone="end"
                    onPress={() => void rejectCall()}
                  />
                  <CallControl
                    icon={<PhoneIncomingIcon className="size-5" strokeWidth={2} />}
                    label="Accept"
                    tone="accept"
                    onPress={() => void acceptCall()}
                  />
                </>
              ) : null}

              {status === "active" ? (
                <>
                  <CallControl
                    icon={isMuted ? <MicOffIcon className="size-5" strokeWidth={2} /> : <MicIcon className="size-5" strokeWidth={2} />}
                    label={isMuted ? "Unmute" : "Mute"}
                    tone="mute"
                    active={isMuted}
                    onPress={() => void toggleMute()}
                  />
                  <CallControl
                    icon={isSpeakerOn ? <Volume2Icon className="size-5" strokeWidth={2} /> : <VolumeXIcon className="size-5" strokeWidth={2} />}
                    label={isSpeakerOn ? "Speaker" : "Speaker off"}
                    tone="speaker"
                    active={!isSpeakerOn}
                    onPress={() => void toggleSpeaker()}
                  />
                  <CallControl
                    icon={<PhoneOffIcon className="size-5" strokeWidth={2} />}
                    label="End"
                    tone="end"
                    onPress={() => void endCall()}
                  />
                </>
              ) : null}

              {status === "missed" ? (
                <CallControl
                  icon={<PhoneIcon className="size-5" strokeWidth={2} />}
                  label="Close"
                  tone="neutral"
                  onPress={reset}
                />
              ) : null}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}