import { useRgb } from "../context/RgbContext";
import { useChatStore } from "../store/useChatStore";
import { useSelectedConversation } from "../hooks/useSelectedConversation";
import { useEffect } from "react";
import { fetchLocationConfig } from "../lib/locationApi";
import { useUnreadDocumentTitle } from "../hooks/useUnreadDocumentTitle";
import ChatSidebar from "../components/chat/ChatSidebar";
import { ChannelIntel } from "../components/chat/ChannelIntel";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageList } from "../components/chat/MessageList";
import { ChatComposer } from "../components/chat/ChatComposer";

function ChatPage() {
  const { rgbStyle, showGlow } = useRgb();

  const getConversations = useChatStore((state) => state.getConversations);
  const getMessages = useChatStore((state) => state.getMessages);
  const getUsers = useChatStore((state) => state.getUsers);
  const markConversationRead = useChatStore((state) => state.markConversationRead);

  const { activeConversation, activeConversationId, isLargeScreen } = useSelectedConversation();

  useUnreadDocumentTitle();

  useEffect(() => {
    getUsers();
    getConversations();
    void fetchLocationConfig();
  }, [getConversations, getUsers]);

  useEffect(() => {
    if (!activeConversationId) return;

    getMessages(activeConversationId);
    markConversationRead(activeConversationId);
  }, [getMessages, activeConversationId, markConversationRead]);

  return (
    <div className="app-shell">
      <div className="app-shell-backdrop" aria-hidden />
      <div
        className="cyber-rgb-frame rgb-border-glow shadow-2xl"
        style={rgbStyle}
      >
        {showGlow && <div className="rgb-backdrop-glow" />}
        <div className="cyber-frame-inner">
          <ChatSidebar />

          <div
            className={`cyber-chat-stage ${
              !isLargeScreen && !activeConversationId ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="cyber-glass-panel cyber-main-panel flex flex-col overflow-hidden">
              <ChatHeader />
              <MessageList displayMessages={activeConversation?.messages} />
              <ChatComposer />
            </div>
            {activeConversation ? <ChannelIntel /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChatPage;
