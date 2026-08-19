import { getInitials, useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { getMessagePreview } from "../../lib/messagePreview";
import { formatMessageTime } from "../../lib/utils";
import { APP_NAME, AppLogo } from "../AppLogo";
import { MessageSquareIcon, SearchIcon, UsersIcon } from "lucide-react";
import { ConversationRow } from "./ConversationRow";
import { AvatarWithOnlineIndicator } from "./AvatarWithOnlineIndicator";

function mapUserForList(user, onlineUsers, { unreadCounts = {}, conversationMeta = {} } = {}) {
  const id = String(user._id);
  const meta = conversationMeta[id];
  const unreadCount = unreadCounts[id] ?? meta?.unreadCount ?? 0;
  const lastMessage = meta?.lastMessage;

  return {
    conversationId: user._id,
    id: user._id,
    name: user.fullName,
    avatarUrl: user.profilePic ?? user.profilePicture,
    initials: getInitials(user.fullName),
    isOnline: onlineUsers.includes(user._id),
    unreadCount,
    lastMessagePreview: lastMessage ? getMessagePreview(lastMessage) : "",
    lastMessageAt: lastMessage?.createdAt ? formatMessageTime(lastMessage.createdAt) : "",
    peer: {
      name: user.fullName,
      avatarUrl: user.profilePic ?? user.profilePicture,
      initials: getInitials(user.fullName),
      isOnline: onlineUsers.includes(user._id),
    },
  };
}

function buildConversationMeta(conversations) {
  const conversationMeta = {};
  for (const conversation of conversations) {
    conversationMeta[String(conversation._id)] = {
      unreadCount: conversation.unreadCount ?? 0,
      lastMessage: conversation.lastMessage,
    };
  }
  return conversationMeta;
}

function ChatSidebar() {
  const conversations = useChatStore((state) => state.conversations);
  const users = useChatStore((state) => state.users);
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  const searchQuery = useChatStore((state) => state.searchQuery);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);

  const sidebarTab = useChatStore((state) => state.sidebarTab);
  const setSidebarTab = useChatStore((state) => state.setSidebarTab);

  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const setSettingsOpen = useChatStore((state) => state.setSettingsOpen);

  const authUser = useAuthStore((state) => state.authUser);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);

  const { activeConversationId, isLargeScreen } = useSelectedConversation();

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const conversationMeta = buildConversationMeta(conversations);
  const listOptions = { unreadCounts, conversationMeta };

  const conversationUsers = conversations.map((user) =>
    mapUserForList(user, onlineUsers, listOptions),
  );
  const allUsers = users.map((user) => mapUserForList(user, onlineUsers, listOptions));

  const filteredConversations = normalizedSearchQuery
    ? conversationUsers.filter((conversation) =>
        conversation.peer.name.toLowerCase().includes(normalizedSearchQuery),
      )
    : conversationUsers;

  const filteredUsers = normalizedSearchQuery
    ? allUsers.filter((user) => user.name.toLowerCase().includes(normalizedSearchQuery))
    : allUsers;

  const listItems = sidebarTab === "chats" ? filteredConversations : filteredUsers;

  const authAvatarUrl = authUser?.profilePic ?? authUser?.profilePicture;
  const authInitials = getInitials(authUser?.fullName ?? "");

  return (
    <aside
      className={`cyber-glass-panel cyber-sidebar flex-col overflow-hidden ${
        !isLargeScreen && activeConversationId ? "hidden lg:flex" : "flex"
      }`}
    >
      <div className="cyber-sidebar-header">
        <div className="flex items-start gap-2.5">
          <AppLogo
            size={52}
            className="size-9 shrink-0 rounded-lg ring-1 ring-cyan-400/25"
            alt=""
          />
          <div className="min-w-0 flex-1">
            <p className="brand-title truncate">{APP_NAME}</p>
            <p className="label-tech mt-0.5">Protocol 4.2 Active</p>
          </div>
          <button
            type="button"
            aria-label="Open settings"
            title="Settings"
            onClick={() => setSettingsOpen(true)}
            className="relative inline-flex shrink-0 cursor-pointer rounded-full transition-transform focus-visible:outline-none focus-visible:shadow-[var(--cl-focus)] active:scale-95"
          >
            <AvatarWithOnlineIndicator isOnline={onlineUsers.includes(authUser?._id)}>
              {authAvatarUrl ? (
                <img src={authAvatarUrl} alt="" className="size-8 rounded-full object-cover" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-[var(--cl-glass)] font-mono text-xs font-medium text-[var(--cl-glow-cyan)]">
                  {authInitials}
                </span>
              )}
            </AvatarWithOnlineIndicator>
          </button>
        </div>
      </div>

      <div className="cyber-search-wrap">
        <SearchIcon className="cyber-search-icon size-4" aria-hidden />
        <input
          type="search"
          className="cyber-search-input"
          placeholder="Search decrypted streams..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="cyber-tabs">
        <button
          type="button"
          className={`cyber-tab ${sidebarTab === "chats" ? "cyber-tab--active" : ""}`}
          onClick={() => setSidebarTab("chats")}
        >
          <MessageSquareIcon className="size-3.5" aria-hidden />
          Chats
        </button>
        <button
          type="button"
          className={`cyber-tab ${sidebarTab === "users" ? "cyber-tab--active" : ""}`}
          onClick={() => setSidebarTab("users")}
        >
          <UsersIcon className="size-3.5" aria-hidden />
          Users
        </button>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        {listItems.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[var(--cl-on-surface-variant)]">
            {sidebarTab === "chats"
              ? "No conversations match your search."
              : "No people match your search."}
          </p>
        ) : (
          listItems.map((item) => (
            <ConversationRow
              key={item.id ?? item.conversationId}
              user={item}
              selected={(item.id ?? item.conversationId) === activeConversationId}
              onSelect={() => setActiveConversationId(item.id ?? item.conversationId)}
              unreadCount={item.unreadCount}
              lastMessagePreview={item.lastMessagePreview}
              lastMessageAt={item.lastMessageAt}
            />
          ))
        )}
      </div>

      <div className="cyber-sidebar-footer">
        <div className="flex items-center gap-2">
          <span className="cyber-status-dot" aria-hidden />
          <span className="label-tech text-[11px] text-[var(--cl-status-online)]">
            System: Secure
          </span>
        </div>
      </div>
    </aside>
  );
}
export default ChatSidebar;
