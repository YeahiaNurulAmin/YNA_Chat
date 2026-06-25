export function getMessagePreview(message) {
  if (!message) return "";

  const text = typeof message.text === "string" ? message.text.trim() : "";
  if (text) return text;

  if (message.isLiveLocation) return "Live location";
  if (message.location) return "Location";

  const hasItems = (value) => Array.isArray(value) && value.length > 0;

  if (hasItems(message.image)) return "Photo";
  if (hasItems(message.video)) return "Video";
  if (hasItems(message.voice)) return "Voice message";
  if (hasItems(message.audio)) return "Audio";
  if (hasItems(message.document)) return "Document";

  return "New message";
}
