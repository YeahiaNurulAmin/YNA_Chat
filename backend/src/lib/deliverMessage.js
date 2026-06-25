import { getReceiverSocketId, io } from "./socket.js";

export async function deliverMessage(messageDoc, receiverId) {
  const saved = await messageDoc.save();
  const payload = typeof saved.toObject === "function" ? saved.toObject() : saved;

  try {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", payload);
    }
  } catch (error) {
    console.error("Socket delivery failed:", error.message);
  }

  return saved;
}

export function emitMessageDeleted({ messageId, senderId, receiverId }) {
  const payload = { messageId: String(messageId) };

  try {
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", payload);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", payload);
    }
  } catch (error) {
    console.error("Socket delete notification failed:", error.message);
  }
}
