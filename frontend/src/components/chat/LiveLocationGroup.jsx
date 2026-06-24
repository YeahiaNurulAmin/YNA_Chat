import { MessageLocation } from "./MessageLocation";

export function LiveLocationGroup({ group }) {
  const latest = group.latestMessage ?? group.latest;
  const { messages, role } = group;
  const isOwnMessage = role === "me";

  return (
    <div className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(90%,28rem)] rounded-2xl px-3 py-2 text-[15px] leading-snug sm:max-w-[min(75%,28rem)] sm:px-3.5 ${
          isOwnMessage
            ? "rounded-br-md bg-accent text-accent-foreground"
            : "rounded-bl-md bg-surface"
        }`}
      >
        <MessageLocation
          location={latest.location}
          isLiveLocation
          time={latest.time}
          isOwnMessage={isOwnMessage}
        />
        <p
          className={`text-[11px] tabular-nums ${
            isOwnMessage ? "text-accent-foreground/75" : "text-muted"
          }`}
        >
          {messages.length} update{messages.length === 1 ? "" : "s"} · Last at {latest.time}
        </p>
      </div>
    </div>
  );
}
