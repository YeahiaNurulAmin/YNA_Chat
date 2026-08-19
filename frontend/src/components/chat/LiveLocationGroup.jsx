/**
 * Collapsed live-location message group in the chat stream.
 * Used by MessageList for consecutive live-location updates.
 */

import { MessageLocation } from "./MessageLocation";

export function LiveLocationGroup({ group }) {
  const latest = group.latestMessage ?? group.latest;
  const { messages, role } = group;
  const isOwnMessage = role === "me";

  return (
    <div className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`live-location-card ${
          isOwnMessage ? "live-location-card--own" : "live-location-card--peer"
        }`}
      >
        <MessageLocation
          location={latest.location}
          isLiveLocation
          time={latest.time}
          isOwnMessage={isOwnMessage}
        />
        <p className="font-mono text-[11px] tabular-nums text-[var(--cl-outline)]">
          {messages.length} update{messages.length === 1 ? "" : "s"} · Last at {latest.time}
        </p>
      </div>
    </div>
  );
}
