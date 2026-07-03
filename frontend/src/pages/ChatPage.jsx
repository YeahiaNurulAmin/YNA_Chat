import { useRgb } from "../context/RgbContext";
import { useChatStore } from "../store/useChatStore";
import { useSelectedConversation } from "../hooks/useSelectedConversation";
import { useEffect } from "react";
import { fetchLocationConfig } from "../lib/locationApi";
import { useUnreadDocumentTitle } from "../hooks/useUnreadDocumentTitle";
import ChatSidebar from "../components/chat/ChatSidebar";
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
    <div className="flex h-dvh flex-col overflow-hidden p-0 bg-[#09090b] relative select-none">
      <div className="relative flex w-full flex-1 rounded-3xl p-[3px] overflow-hidden rgb-border-glow shadow-2xl" style={rgbStyle}>
        {showGlow && <div className="rgb-backdrop-glow" />}
        <div className="relative flex w-full flex-1 overflow-hidden rounded-[21px] bg-background text-foreground z-10 border border-border/30">
          <ChatSidebar />

          <div
            className={`flex-1 flex-col overflow-hidden ${
              !isLargeScreen && !activeConversationId ? "hidden lg:flex" : "flex"
            }`}
          >
            <ChatHeader />
            <MessageList displayMessages={activeConversation?.messages} />

            {activeConversation ? <ChatComposer /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChatPage;
