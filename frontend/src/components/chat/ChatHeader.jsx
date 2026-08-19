import { Avatar } from "@heroui/react";
import {
  ChevronLeftIcon,
  PhoneIcon,
  VideoIcon,
} from "lucide-react";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";
import { useChatStore } from "../../store/useChatStore";
import { useCallStore } from "../../store/useCallStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";

const CALL_CHIP_LABELS = {
  outgoing: "Ringing",
  incoming: "Incoming",
  connecting: "Connecting",
  active: "In Call",
};

export function ChatHeader() {
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const { activeConversation, isLargeScreen } = useSelectedConversation();
  const callStatus = useCallStore((state) => state.status);
  const callPeer = useCallStore((state) => state.peer);
  const startCall = useCallStore((state) => state.startCall);

  const isCallWithActivePeer =
    activeConversation &&
    callPeer &&
    String(callPeer.id) === String(activeConversation.id);

  const callChipLabel =
    isCallWithActivePeer && CALL_CHIP_LABELS[callStatus]
      ? CALL_CHIP_LABELS[callStatus]
      : null;

  const canStartCall =
    Boolean(activeConversation?.peer.isOnline) && callStatus === "idle";

  const handleStartCall = (callType) => {
    if (!activeConversation || !canStartCall) return;
    void startCall({
      id: activeConversation.id,
      name: activeConversation.peer.name,
      avatarUrl: activeConversation.peer.avatarUrl,
      initials: activeConversation.peer.initials,
    }, callType);
  };

  if (!activeConversation) {
    return (
      <header className="cyber-terminal-header">
        <p className="headline-md flex-1 text-center sm:text-left">Select a conversation</p>
      </header>
    );
  }

  return (
    <header className="cyber-terminal-header">
      {!isLargeScreen ? (
        <button
          type="button"
          className="cyber-header-icon"
          aria-label="Back to conversations"
          onClick={() => setActiveConversationId(null)}
        >
          <ChevronLeftIcon className="size-5" strokeWidth={2} />
        </button>
      ) : null}

      <AvatarWithOnlineIndicator isOnline={activeConversation.peer.isOnline ?? true}>
        <Avatar className="size-10 shrink-0">
          <Avatar.Image
            alt={activeConversation.peer.name}
            src={activeConversation.peer.avatarUrl}
          />
          <Avatar.Fallback className="text-sm font-medium">
            {activeConversation.peer.initials}
          </Avatar.Fallback>
        </Avatar>
      </AvatarWithOnlineIndicator>

      <div className="min-w-0 flex-1">
        <p className="headline-md truncate">{activeConversation.peer.name}</p>
        <p className="label-tech mt-0.5 truncate">
          {activeConversation.peer.isOnline ? (
            <span className="text-[var(--cl-status-online)]">Online</span>
          ) : (
            <span>Offline</span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {callChipLabel ? (
          <span className="call-status-chip" role="status">
            {callChipLabel}
          </span>
        ) : null}

        <button
          type="button"
          className="cyber-header-icon hidden sm:flex text-[var(--cl-glow-violet)] border-[rgba(139,92,246,0.4)]"
          disabled={!canStartCall}
          aria-label="Start video call"
          title="Start video call"
          onClick={() => handleStartCall("video")}
        >
          <VideoIcon className="size-4" strokeWidth={2} />
        </button>

        <button
          type="button"
          className="cyber-header-icon"
          disabled={!canStartCall}
          aria-label="Start voice call"
          onClick={() => handleStartCall("audio")}
        >
          <PhoneIcon className="size-4" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
