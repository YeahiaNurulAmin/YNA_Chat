import useScrollToBottom from "../../hooks/useScrollToBottom";
import { MessageBubble } from "./MessageBubble";
import { LiveLocationGroup } from "./LiveLocationGroup";
import { NoConversationPlaceholder } from "./NoConversationPlaceholder";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";

export function MessageList({ displayMessages }) {
  const { activeConversation, activeConversationId } = useSelectedConversation();
  const messages = displayMessages ?? activeConversation?.messages ?? [];

  const lastItem = messages.at(-1);
  const lastMessageId =
    lastItem?.kind === "liveLocationGroup" ? lastItem.latest?.id : lastItem?.id;
  const messagesScrollRef = useScrollToBottom(activeConversationId, lastMessageId);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {activeConversation ? (
        <div
          ref={messagesScrollRef}
          className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3 sm:py-4"
        >
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
            Today
          </p>
          {messages.map((item) =>
            item.kind === "liveLocationGroup" ? (
              <LiveLocationGroup key={item.id} group={item} />
            ) : (
              <MessageBubble key={item.id} message={item} />
            ),
          )}
        </div>
      ) : (
        <NoConversationPlaceholder />
      )}
    </div>
  );
}
