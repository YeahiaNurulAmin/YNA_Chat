/**
 * Wraps an Avatar with a bottom-right presence dot (online / offline).
 * Used in ConversationRow, ChatHeader, and AudioCallModal.
 */
export function AvatarWithOnlineIndicator({ isOnline, children, dotClassName = "" }) {
  return (
    <div className="relative inline-flex shrink-0">
      {children}
      <span
        className={`pointer-events-none absolute bottom-0 right-0 z-10 size-[11px] rounded-full border-[2.5px] border-[var(--cl-bg)] ${isOnline ? "bg-[var(--cl-status-online)] status-online-bloom" : "bg-[var(--cl-outline)]"} ${dotClassName}`}
        aria-hidden
      />
      <span className="sr-only">{isOnline ? "Online" : "Offline"}</span>
    </div>
  );
}
