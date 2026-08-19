import { Avatar, Modal, useOverlayState } from "@heroui/react";
import {
  CameraIcon,
  CameraOffIcon,
  LoaderIcon,
  LockIcon,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  PhoneOffIcon,
  PhoneIncomingIcon,
  RefreshCwIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useCallMediaState } from "../../hooks/useLivekitCall";
import { useIncomingRingtone, useOutgoingRingback } from "../../hooks/useCallSounds";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { CallControl } from "./CallControl";
import { LocalVideoFeed, RemoteVideoFeed } from "./VideoFeeds";

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const STATUS_LABEL = {
  outgoing: "Ringing",
  incoming: "Incoming Video Call",
  connecting: "Connecting",
  active: "In Call",
  missed: "Call Ended",
};

export function VideoCallModal() {
  const status = useCallStore((state) => state.status);
  const callType = useCallStore((state) => state.callType);
  const peer = useCallStore((state) => state.peer);
  const isMuted = useCallStore((state) => state.isMuted);
  const isSpeakerOn = useCallStore((state) => state.isSpeakerOn);
  const isCameraOn = useCallStore((state) => state.isCameraOn);
  const callDurationSeconds = useCallStore((state) => state.callDurationSeconds);
  const acceptCall = useCallStore((state) => state.acceptCall);
  const rejectCall = useCallStore((state) => state.rejectCall);
  const cancelCall = useCallStore((state) => state.cancelCall);
  const endCall = useCallStore((state) => state.endCall);
  const reset = useCallStore((state) => state.reset);
  const toggleMute = useCallStore((state) => state.toggleMute);
  const toggleSpeaker = useCallStore((state) => state.toggleSpeaker);
  const toggleCamera = useCallStore((state) => state.toggleCamera);
  const switchCamera = useCallStore((state) => state.switchCamera);
  const isMinimized = useCallStore((state) => state.isMinimized);
  const minimizeCall = useCallStore((state) => state.minimizeCall);

  const { remoteVideoTrack, remoteVideoMuted, localCameraTrack } = useCallMediaState();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const isVideo = callType === "video";
  const isOpen = isVideo && !isMinimized && ["outgoing", "incoming", "connecting", "active", "missed"].includes(status);

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

  useIncomingRingtone(isVideo && status === "incoming");
  useOutgoingRingback(isVideo && status === "outgoing");

  if (!isVideo) return null;

  const ringing = status === "outgoing" || status === "incoming" || status === "connecting";

  const statusText =
    status === "active" ? formatDuration(callDurationSeconds) : STATUS_LABEL[status] ?? "";

  const remoteVideoVisible = Boolean(remoteVideoTrack) && !remoteVideoMuted;

  return (
    <Modal state={modal}>
      <Modal.Backdrop variant="opaque">
        <Modal.Container size="full">
          <Modal.Dialog className="glass-modal cyber-call-overlay cyber-video-call-overlay">
            <Modal.Header className="cyber-call-topbar">
              <div className="cyber-call-secure">
                <LockIcon className="size-3" strokeWidth={2} />
                End-to-end encrypted
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body
              className={`cyber-call-body${status === "active" ? " cyber-video-call-body" : ""}`}
            >
              {status === "active" ? (
                <div className="cyber-video-stage">
                  <div className="cyber-video-remote">
                    {remoteVideoVisible ? (
                      <RemoteVideoFeed className="cyber-video-feed" />
                    ) : (
                      <div className="cyber-video-remote-fallback">
                        <div className="avatar-neon-ring rounded-full">
                          <Avatar className="size-24">
                            <Avatar.Image alt={peer?.name} src={peer?.avatarUrl} />
                            <Avatar.Fallback className="text-xl font-semibold">
                              {peer?.initials}
                            </Avatar.Fallback>
                          </Avatar>
                        </div>
                        <span className="cyber-video-fallback-label">Camera is off</span>
                      </div>
                    )}
                  </div>

                  <div className="cyber-video-pip">
                    {localCameraTrack && isCameraOn ? (
                      <LocalVideoFeed className="cyber-video-feed cyber-video-pip-feed" />
                    ) : (
                      <div className="cyber-video-pip-fallback">
                        <CameraOffIcon className="size-5" strokeWidth={2} />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
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
                      <Avatar.Image alt={peer?.name} src={peer?.avatarUrl} />
                      <Avatar.Fallback className="text-2xl font-semibold">
                        {peer?.initials}
                      </Avatar.Fallback>
                    </Avatar>
                  </div>
                  <span
                    className={`cyber-call-presence${ringing ? " cyber-call-presence--ringing" : ""}`}
                    aria-hidden
                  />
                </div>
              )}

              <p className="cyber-call-name">{peer?.name ?? "Video call"}</p>

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

            <Modal.Footer className="cyber-call-controls cyber-video-call-controls">
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
                    icon={isCameraOn ? <CameraIcon className="size-5" strokeWidth={2} /> : <CameraOffIcon className="size-5" strokeWidth={2} />}
                    label={isCameraOn ? "Camera on" : "Camera off"}
                    tone="mute"
                    active={!isCameraOn}
                    onPress={() => void toggleCamera()}
                  />
                  {isMobile ? (
                    <CallControl
                      icon={<RefreshCwIcon className="size-5" strokeWidth={2} />}
                      label="Flip camera"
                      tone="speaker"
                      onPress={() => void switchCamera()}
                    />
                  ) : null}
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