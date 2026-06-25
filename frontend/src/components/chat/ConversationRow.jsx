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
      className={`flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left ${
        selected ? "bg-accent-soft" : ""
      }`}
    >
      <AvatarWithOnlineIndicator isOnline={user.isOnline ?? true}>
        <Avatar className="size-12 shrink-0">
          <Avatar.Image alt={user.name} src={user.avatarUrl} />
          <Avatar.Fallback className="text-sm font-medium">{user.initials}</Avatar.Fallback>
        </Avatar>
      </AvatarWithOnlineIndicator>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-[15px] ${hasUnread ? "font-bold" : "font-semibold"}`}
          >
            {user.name}
          </p>
          {lastMessageAt ? (
            <span className="ml-auto shrink-0 text-[11px] text-muted">{lastMessageAt}</span>
          ) : null}
        </div>
        {lastMessagePreview ? (
          <p className={`truncate text-sm ${hasUnread ? "font-medium text-foreground" : "text-muted"}`}>
            {lastMessagePreview}
          </p>
        ) : null}
      </div>

      {hasUnread ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
