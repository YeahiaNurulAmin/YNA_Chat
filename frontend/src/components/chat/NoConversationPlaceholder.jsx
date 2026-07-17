import { MessageCircleIcon } from "lucide-react";

export function NoConversationPlaceholder() {
  return (
    <div className="cyber-empty-state">
      <div className="cyber-empty-state__orb" aria-hidden>
        <MessageCircleIcon className="size-10 text-[var(--cl-glow-cyan)]" strokeWidth={1.25} />
      </div>
      <div className="space-y-2">
        <h2 className="headline-md">Select a chat to start</h2>
        <p>
          Pick a conversation from the list on the left to read messages and reply.
        </p>
      </div>
    </div>
  );
}
