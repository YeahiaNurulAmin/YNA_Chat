import { useRef, useState } from "react";
import { Avatar } from "@heroui/react";
import {
  LoaderIcon,
  Maximize2Icon,
  PhoneIncomingIcon,
  PhoneOffIcon,
} from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useCallMediaState } from "../../hooks/useLivekitCall";
import { RemoteVideoFeed } from "./VideoFeeds";

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function MinimizedCallBar() {
  const status = useCallStore((state) => state.status);
  const callType = useCallStore((state) => state.callType);
  const peer = useCallStore((state) => state.peer);
  const callDurationSeconds = useCallStore((state) => state.callDurationSeconds);
  const isMinimized = useCallStore((state) => state.isMinimized);
  const restoreCall = useCallStore((state) => state.restoreCall);
  const endCall = useCallStore((state) => state.endCall);
  const acceptCall = useCallStore((state) => state.acceptCall);
  const rejectCall = useCallStore((state) => state.rejectCall);
  const cancelCall = useCallStore((state) => state.cancelCall);

  const { remoteVideoTrack, remoteVideoMuted } = useCallMediaState();

  const barRef = useRef(null);
  const dragRef = useRef(null);
  const suppressedClickRef = useRef(false);
  const [position, setPosition] = useState(null);

  if (!isMinimized || !["outgoing", "incoming", "connecting", "active"].includes(status)) return null;

  const isVideo = callType === "video";
  const remoteVideoVisible = isVideo && Boolean(remoteVideoTrack) && !remoteVideoMuted;

  const barStyle = position
    ? { left: position.left, top: position.top, right: "auto", bottom: "auto" }
    : undefined;

  const handlePointerDown = (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if (event.target.closest?.(".cyber-call-minimized__actions")) return;
    const rect = barRef.current.getBoundingClientRect();
    const origin = position ?? { left: rect.left, top: rect.top };
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.left,
      originY: origin.top,
      width: rect.width,
      height: rect.height,
    };
    suppressedClickRef.current = false;
    barRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4
    ) {
      suppressedClickRef.current = true;
    }
    const maxX = Math.max(0, window.innerWidth - drag.width);
    const maxY = Math.max(0, window.innerHeight - drag.height);
    setPosition({
      left: Math.min(Math.max(0, drag.originX + event.clientX - drag.startX), maxX),
      top: Math.min(Math.max(0, drag.originY + event.clientY - drag.startY), maxY),
    });
  };

  const endDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    if (barRef.current?.hasPointerCapture(event.pointerId)) {
      barRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const handleRestoreClick = () => {
    if (suppressedClickRef.current) {
      suppressedClickRef.current = false;
      return;
    }
    restoreCall();
  };

  const handleEndClick = () => {
    if (suppressedClickRef.current) {
      suppressedClickRef.current = false;
      return;
    }
    if (status === "incoming") {
      void rejectCall();
    } else if (status === "outgoing") {
      cancelCall();
    } else {
      void endCall();
    }
  };

  const handleAcceptClick = () => {
    if (suppressedClickRef.current) {
      suppressedClickRef.current = false;
      return;
    }
    void acceptCall().then(() => restoreCall());
  };

  return (
    <div
      ref={barRef}
      className="cyber-call-minimized"
      style={barStyle}
      role="status"
      aria-label="Call in progress"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
    >
      <button
        type="button"
        className="cyber-call-minimized__main"
        aria-label={`Restore ${isVideo ? "video" : "voice"} call with ${peer?.name ?? "contact"}`}
        onClick={handleRestoreClick}
      >
        {isVideo ? (
          <div className="cyber-call-minimized__preview cyber-call-minimized__preview--video">
            {remoteVideoVisible ? (
              <RemoteVideoFeed className="cyber-call-minimized__feed" />
            ) : (
              <div className="cyber-call-minimized__preview-fallback">
                <Avatar className="size-14">
                  <Avatar.Image alt={peer?.name} src={peer?.avatarUrl} />
                  <Avatar.Fallback className="text-sm font-semibold">
                    {peer?.initials}
                  </Avatar.Fallback>
                </Avatar>
              </div>
            )}
          </div>
        ) : (
          <div className="cyber-call-minimized__preview">
            <Avatar className="size-12">
              <Avatar.Image alt={peer?.name} src={peer?.avatarUrl} />
              <Avatar.Fallback className="text-sm font-semibold">
                {peer?.initials}
              </Avatar.Fallback>
            </Avatar>
          </div>
        )}

        <span className="cyber-call-minimized__meta">
          <span className="cyber-call-minimized__name">{peer?.name ?? "Call"}</span>
          <span className="cyber-call-minimized__status">
            {status === "outgoing" ? (
              "Ringing"
            ) : status === "incoming" ? (
              "Incoming"
            ) : status === "connecting" ? (
              <>
                <LoaderIcon className="size-3 animate-spin" strokeWidth={2} />
                Connecting
              </>
            ) : (
              formatDuration(callDurationSeconds)
            )}
          </span>
        </span>
      </button>

      <div className="cyber-call-minimized__actions">
        {status === "incoming" ? (
          <button
            type="button"
            className="cyber-call-minimized__accept"
            aria-label="Accept call"
            title="Accept call"
            onClick={handleAcceptClick}
          >
            <PhoneIncomingIcon className="size-4" strokeWidth={2} />
          </button>
        ) : null}
        <button
          type="button"
          className="cyber-call-minimized__expand"
          aria-label="Restore call"
          title="Restore call"
          onClick={handleRestoreClick}
        >
          <Maximize2Icon className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="cyber-call-minimized__end"
          aria-label={
            status === "incoming"
              ? "Decline call"
              : status === "outgoing"
                ? "Cancel call"
                : "End call"
          }
          title={
            status === "incoming"
              ? "Decline call"
              : status === "outgoing"
                ? "Cancel call"
                : "End call"
          }
          onClick={handleEndClick}
        >
          <PhoneOffIcon className="size-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}