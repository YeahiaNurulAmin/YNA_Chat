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
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      capturedAt: { type: Date },
      label: { type: String },
    },
    isLiveLocation: {
      type: Boolean,
      default: false,
    },
    liveSessionId: {
      type: String,
    },
    readAt: {
      type: Date,
      default: null,
    },
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
      text: {
        type: String,
      },
      senderName: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
