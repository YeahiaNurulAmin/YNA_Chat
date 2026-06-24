import { getReceiverSocketId, io } from "./socket.js";

export async function deliverMessage(messageDoc, receiverId) {
  await messageDoc.save();

  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", messageDoc);
  }

  return messageDoc;
}
