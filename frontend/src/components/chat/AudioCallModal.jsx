import { Avatar, Button, Modal, useOverlayState } from "@heroui/react";
import {
  LoaderIcon,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  PhoneOffIcon,
  PhoneIncomingIcon,
} from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useIncomingRingtone, useOutgoingRingback } from "../../hooks/useCallSounds";

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function AudioCallModal() {
  const status = useCallStore((state) => state.status);
  const peer = useCallStore((state) => state.peer);
  const isMuted = useCallStore((state) => state.isMuted);
  const callDurationSeconds = useCallStore((state) => state.callDurationSeconds);
  const acceptCall = useCallStore((state) => state.acceptCall);
  const rejectCall = useCallStore((state) => state.rejectCall);
  const cancelCall = useCallStore((state) => state.cancelCall);
  const endCall = useCallStore((state) => state.endCall);
  const reset = useCallStore((state) => state.reset);
  const toggleMute = useCallStore((state) => state.toggleMute);

  const isOpen = ["outgoing", "incoming", "connecting", "active", "missed"].includes(status);

  const modal = useOverlayState({
    isOpen,
    onOpenChange: (open) => {
      if (!open && ["outgoing", "incoming"].includes(status)) {
        if (status === "outgoing") cancelCall();
        if (status === "incoming") void rejectCall();
      }
    },
  });

  useIncomingRingtone(status === "incoming");
  useOutgoingRingback(status === "outgoing");

  const title =
    status === "outgoing"
      ? "Ringing…"
      : status === "incoming"
        ? "Incoming call"
        : status === "connecting"
          ? "Connecting…"
          : status === "active"
            ? formatDuration(callDurationSeconds)
            : status === "missed"
              ? "Call not answered"
              : "";

  return (
    <Modal state={modal}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm">
          <Modal.Dialog className="items-center text-center">
            <Modal.Header className="flex w-full flex-col items-center gap-3 pb-2">
              <div className="flex w-full justify-end">
                <Modal.CloseTrigger />
              </div>
              {peer ? (
                <Avatar className="size-20">
                  <Avatar.Image alt={peer.name} src={peer.avatarUrl} />
                  <Avatar.Fallback className="text-xl font-semibold">{peer.initials}</Avatar.Fallback>
                </Avatar>
              ) : null}
              <div>
                <p className="text-lg font-semibold">{peer?.name ?? "Voice call"}</p>
                <p className="text-sm text-muted">{title}</p>
              </div>
            </Modal.Header>

            <Modal.Footer className="flex w-full justify-center gap-3 pt-4">
              {status === "outgoing" ? (
                <Button color="danger" variant="secondary" onPress={cancelCall}>
                  <PhoneOffIcon className="size-4" />
                  Cancel
                </Button>
              ) : null}

              {status === "incoming" ? (
                <>
                  <Button color="danger" variant="secondary" onPress={() => void rejectCall()}>
                    <PhoneOffIcon className="size-4" />
                    Decline
                  </Button>
                  <Button color="success" onPress={() => void acceptCall()}>
                    <PhoneIncomingIcon className="size-4" />
                    Accept
                  </Button>
                </>
              ) : null}

              {status === "connecting" ? (
                <Button isDisabled variant="secondary">
                  <LoaderIcon className="size-4 animate-spin" />
                  Connecting
                </Button>
              ) : null}

              {status === "active" ? (
                <>
                  <Button
                    variant={isMuted ? "primary" : "secondary"}
                    size="lg"
                    isIconOnly
                    aria-pressed={isMuted}
                    aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                    onPress={() => {
                      void toggleMute();
                    }}
                  >
                    {isMuted ? <MicOffIcon className="size-5" /> : <MicIcon className="size-5" />}
                  </Button>
                  <Button color="danger" onPress={() => void endCall()}>
                    <PhoneOffIcon className="size-4" />
                    End call
                  </Button>
                </>
              ) : null}

              {status === "missed" ? (
                <Button variant="secondary" onPress={reset}>
                  <PhoneIcon className="size-4" />
                  Close
                </Button>
              ) : null}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
