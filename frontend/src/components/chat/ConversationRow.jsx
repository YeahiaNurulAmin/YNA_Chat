/**
 * Conversation list row for chats/users sidebar.
 * Used in ChatSidebar under the Chats and Users tabs.
 */

import { Avatar } from "@heroui/react";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";

export function ConversationRow({
  user,
  selected,
  onSelect,
  unreadCount = 0,
  lastMessagePreview = "",
  lastMessageAt = "",
}) {
  const hasUnread = unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`conv-row ${selected ? "conv-row--selected" : ""}`}
    >
      <AvatarWithOnlineIndicator isOnline={user.isOnline ?? true}>
        <Avatar className="size-11 shrink-0">
          <Avatar.Image alt={user.name} src={user.avatarUrl} />
          <Avatar.Fallback className="text-sm font-medium">{user.initials}</Avatar.Fallback>
        </Avatar>
      </AvatarWithOnlineIndicator>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`conv-row__name truncate ${hasUnread ? "font-bold" : ""}`}>
            {user.name}
          </p>
          {lastMessageAt ? <span className="conv-row__time">{lastMessageAt}</span> : null}
        </div>
        {lastMessagePreview ? (
          <p
            className={`conv-row__preview truncate ${
              hasUnread ? "font-medium text-[var(--cl-on-surface)]" : ""
            }`}
          >
            {lastMessagePreview}
          </p>
        ) : null}
      </div>

      {hasUnread ? (
        <span className="conv-row__badge">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
