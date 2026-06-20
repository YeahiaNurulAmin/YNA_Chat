import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: [String],
      default: [],
    },
    voice: {
      type: [String],
      default: [],
    },
    video: {
      type: [String],
      default: [],
    },
    audio: {
      type: [String],
      default: [],
    },
    document: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
