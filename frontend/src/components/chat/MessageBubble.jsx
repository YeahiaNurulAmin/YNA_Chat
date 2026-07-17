import { useState } from "react";
import { CheckCheckIcon } from "lucide-react";
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
      className={`msg-reply-quote ${isOwnMessage ? "msg-reply-quote--own" : "msg-reply-quote--peer"}`}
    >
      <p className="msg-reply-quote__name">{replyTo.senderName}</p>
      <p className="msg-reply-quote__text">{replyTo.text}</p>
    </div>
  );
}

export function MessageBubble({ message, peerName = "Contact" }) {
  const isOwnMessage = message.role === "me";
  const { imageUrls, videoUrls, voiceUrls, audioUrls, documentUrls, location } = message;
  const hasLocation = location?.latitude != null && location?.longitude != null;
  const showFooterTime = message.text || !hasLocation;
  const hasMedia =
    imageUrls.length > 0 ||
    videoUrls.length > 0 ||
    voiceUrls.length > 0 ||
    audioUrls.length > 0 ||
    documentUrls.length > 0 ||
    hasLocation;

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
          className={`msg-bubble ${isOwnMessage ? "msg-bubble-own" : "msg-bubble-peer"} ${
            hasMedia && !message.text ? "msg-bubble--media-only" : ""
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
              className="msg-bubble__image"
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
              className="msg-bubble__audio"
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
            <p className="msg-bubble__text whitespace-pre-wrap wrap-break-word">{message.text}</p>
          ) : null}

          <div className="msg-bubble__footer">
            {showFooterTime ? (
              <p className="caption-tabular">{message.time}</p>
            ) : null}
            {isOwnMessage ? (
              <CheckCheckIcon className="msg-bubble__read" strokeWidth={2.25} aria-hidden />
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
