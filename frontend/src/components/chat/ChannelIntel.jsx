/**
 * Right sidebar panel showing peer metadata and shared media (Cyber-Luxe Glass).
 * Used on ChatPage when a conversation is active on large screens.
 */

import { useMemo } from "react";
import { StarIcon } from "lucide-react";
import { withTransform } from "../../lib/imagekit";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";

const THUMB_TRANSFORM = "q-auto,w-160,h-160,c-at_max,f-auto";

function collectSharedImages(messages = []) {
  const urls = [];
  for (const message of messages) {
    if (message.kind === "liveLocationGroup") continue;
    for (const url of message.imageUrls ?? []) {
      if (!urls.includes(url)) urls.push(url);
    }
  }
  return urls;
}

export function ChannelIntel() {
  const { activeConversation } = useSelectedConversation();
  const messages = activeConversation?.messages ?? [];

  const sharedImages = useMemo(() => collectSharedImages(messages), [messages]);
  const visibleThumbs = sharedImages.slice(0, 3);
  const overflowCount = Math.max(0, sharedImages.length - 3);

  if (!activeConversation) return null;

  return (
    <aside className="channel-intel cyber-glass-panel hidden xl:flex">
      <div className="channel-intel__header">
        <h2 className="channel-intel__title">Channel Intel</h2>
      </div>

      <div className="channel-intel__body">
        <div className="intel-card">
          <span className="intel-card__label intel-card__label--cyan">Encryption</span>
          <p className="intel-card__value">End-to-End Quantum</p>
          <div className="intel-card__bar intel-card__bar--cyan" aria-hidden>
            <span style={{ width: "92%" }} />
          </div>
        </div>

        <div className="intel-card">
          <span className="intel-card__label intel-card__label--violet">Peer Reputation</span>
          <div className="intel-card__row">
            <p className="intel-card__value">Elite Operative</p>
            <StarIcon className="intel-card__star" strokeWidth={2} aria-hidden />
          </div>
        </div>

        <div className="channel-intel__media">
          <h3 className="channel-intel__media-title">Shared Media</h3>
          {sharedImages.length === 0 ? (
            <p className="channel-intel__media-empty">No media shared yet</p>
          ) : (
            <div className="channel-intel__media-grid">
              {visibleThumbs.map((url) => (
                <div key={url} className="channel-intel__thumb">
                  <img
                    src={withTransform(url, THUMB_TRANSFORM)}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              ))}
              {overflowCount > 0 ? (
                <div className="channel-intel__thumb channel-intel__thumb--overflow">
                  <span>+{overflowCount}</span>
                </div>
              ) : sharedImages.length < 4 ? (
                <div className="channel-intel__thumb channel-intel__thumb--empty" aria-hidden />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
