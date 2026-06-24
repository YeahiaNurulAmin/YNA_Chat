export function groupMessagesForDisplay(messages) {
  const displayItems = [];
  let index = 0;

  while (index < messages.length) {
    const message = messages[index];

    if (message.isLiveLocation && message.liveSessionId) {
      const liveSessionId = message.liveSessionId;
      const groupedMessages = [message];
      let nextIndex = index + 1;

      while (
        nextIndex < messages.length &&
        messages[nextIndex].isLiveLocation &&
        messages[nextIndex].liveSessionId === liveSessionId
      ) {
        groupedMessages.push(messages[nextIndex]);
        nextIndex += 1;
      }

      displayItems.push({
        kind: "liveLocationGroup",
        id: `live-${liveSessionId}-${groupedMessages[groupedMessages.length - 1].id}`,
        liveSessionId,
        role: message.role,
        messages: groupedMessages,
        latestMessage: groupedMessages[groupedMessages.length - 1],
      });

      index = nextIndex;
      continue;
    }

    displayItems.push({
      kind: "message",
      ...message,
    });
    index += 1;
  }

  return displayItems;
}
