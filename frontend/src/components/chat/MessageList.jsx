import useScrollToBottom from "../../hooks/useScrollToBottom";
import { MessageBubble } from "./MessageBubble";
import { LiveLocationGroup } from "./LiveLocationGroup";
import { NoConversationPlaceholder } from "./NoConversationPlaceholder";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useChatStore } from "../../store/useChatStore";

function formatDateDivider(date = new Date()) {
  const day = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const monthDay = date
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
  return `${day}, ${monthDay}`;
}

function getMessageSenderKey(item) {
  if (item.kind === "liveLocationGroup") return `live-${item.id}`;
  return item.role;
}

export function MessageList({ displayMessages }) {
  const { activeConversation, activeConversationId } = useSelectedConversation();
  const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);
  const messages = displayMessages ?? activeConversation?.messages ?? [];

  const lastItem = messages.at(-1);
  const lastMessageId =
    lastItem?.kind === "liveLocationGroup" ? lastItem.latest?.id : lastItem?.id;
  const messagesScrollRef = useScrollToBottom(activeConversationId, lastMessageId);

  if (activeConversation && isMessagesLoading) {
    return (
      <div className="msg-loading" role="status" aria-label="Loading messages">
        <span className="msg-loading__ring" aria-hidden />
        <span className="msg-loading__label">Loading transmission</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {activeConversation ? (
        <div
          ref={messagesScrollRef}
          className="msg-area flex flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5"
        >
          <p className="msg-date-divider">{formatDateDivider()}</p>

          {messages.map((item, index) => {
            const prevItem = messages[index - 1];
            const senderKey = getMessageSenderKey(item);
            const prevSenderKey = prevItem ? getMessageSenderKey(prevItem) : null;
            const isGrouped = prevSenderKey === senderKey;

            if (item.kind === "liveLocationGroup") {
              return (
                <div
                  key={item.id}
                  className={isGrouped ? "msg-group-gap" : "msg-sender-gap"}
                >
                  <LiveLocationGroup group={item} />
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={isGrouped ? "msg-group-gap" : "msg-sender-gap"}
              >
                <MessageBubble
                  message={item}
                  peerName={activeConversation.peer.name}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <NoConversationPlaceholder />
      )}
    </div>
  );
}
