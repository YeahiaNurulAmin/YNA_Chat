import { useState } from "react";
import { withTransform } from "../../lib/imagekit";
import { getMessagePreview } from "../../lib/messagePreview";
import { useChatStore } from "../../store/useChatStore";
import { MessageVideo } from "./MessageVideo";
import { MessageVoice } from "./MessageVoice";
import { MessageDocument } from "./MessageDocument";
import { MessageLocation } from "./MessageLocation";
import { MessageActionsMenu } from "./MessageActionsMenu";
import { ForwardMessageModal } from "./ForwardMessageModal";

const IMAGE_TRANSFORM = "q-auto,w-640,f-auto";

function MessageReplyQuote({ replyTo, isOwnMessage }) {
  return (
    <div
      className={`mb-2 rounded-lg border-l-2 px-2 py-1.5 ${
        isOwnMessage
          ? "border-accent-foreground/50 bg-accent-foreground/10"
          : "border-accent bg-accent/10"
      }`}
    >
      <p
        className={`truncate text-[11px] font-semibold ${
          isOwnMessage ? "text-accent-foreground" : "text-accent"
        }`}
      >
        {replyTo.senderName}
      </p>
      <p
        className={`truncate text-xs ${
          isOwnMessage ? "text-accent-foreground/80" : "text-muted"
        }`}
      >
        {replyTo.text}
      </p>
    </div>
  );
}

export function MessageBubble({ message, peerName = "Contact" }) {
  const isOwnMessage = message.role === "me";
  const { imageUrls, videoUrls, voiceUrls, audioUrls, documentUrls, location } = message;
  const hasLocation = location?.latitude != null && location?.longitude != null;
  const showFooterTime = message.text || !hasLocation;

  const setReplyingTo = useChatStore((state) => state.setReplyingTo);
  const deleteMessage = useChatStore((state) => state.deleteMessage);

  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

  const replySenderName = isOwnMessage ? "You" : peerName;
  const previewText = getMessagePreview(message) || message.text || "Message";

  const handleReply = () => {
    setReplyingTo({
      messageId: message.id,
      text: previewText,
      senderName: replySenderName,
    });
  };

  const handleDelete = () => {
    void deleteMessage(message.id);
  };

  return (
    <>
      <div className={`group flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}>
        <div
          className={`relative max-w-[min(90%,28rem)] rounded-2xl px-3 py-2 text-[15px] leading-snug sm:max-w-[min(75%,28rem)] sm:px-3.5 ${
            isOwnMessage
              ? "rounded-br-md bg-accent text-accent-foreground"
              : "rounded-bl-md bg-surface"
          }`}
        >
          {message.replyTo ? (
            <MessageReplyQuote replyTo={message.replyTo} isOwnMessage={isOwnMessage} />
          ) : null}

          {imageUrls.map((url) => (
            <img
              key={url}
              src={withTransform(url, IMAGE_TRANSFORM)}
              alt=""
              className="mb-1.5 max-h-40 max-w-full rounded-lg object-cover sm:max-h-52 sm:rounded-xl"
            />
          ))}

          {videoUrls.map((url) => (
            <MessageVideo key={url} src={url} />
          ))}

          {voiceUrls.map((url) => (
            <MessageVoice key={url} src={url} isOwnMessage={isOwnMessage} />
          ))}

          {audioUrls.map((url) => (
            <audio
              key={url}
              src={url}
              controls
              preload="metadata"
              className="mb-1.5 block max-w-full"
            />
          ))}

          {documentUrls.map((url) => (
            <MessageDocument key={url} url={url} isOwnMessage={isOwnMessage} />
          ))}

          {hasLocation ? (
            <MessageLocation
              location={location}
              isLiveLocation={message.isLiveLocation}
              time={message.time}
              isOwnMessage={isOwnMessage}
            />
          ) : null}

          {message.text ? (
            <p className="whitespace-pre-wrap wrap-break-word">{message.text}</p>
          ) : null}

          <div className="mt-1 flex items-end justify-end gap-1">
            {showFooterTime ? (
              <p
                className={`text-[11px] tabular-nums ${
                  isOwnMessage ? "text-accent-foreground/75" : "text-muted"
                }`}
              >
                {message.time}
              </p>
            ) : null}
            <MessageActionsMenu
              isOwnMessage={isOwnMessage}
              onReply={handleReply}
              onForward={() => setIsForwardModalOpen(true)}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      <ForwardMessageModal
        isOpen={isForwardModalOpen}
        onOpenChange={setIsForwardModalOpen}
        message={message}
      />
    </>
  );
}
