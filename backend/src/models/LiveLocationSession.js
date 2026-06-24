import mongoose from "mongoose";
import { randomUUID } from "crypto";

const liveLocationSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      default: () => randomUUID(),
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    intervalMs: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "stopped"],
      default: "active",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    stoppedAt: {
      type: Date,
    },
    lastPingAt: {
      type: Date,
    },
    lastLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      capturedAt: { type: Date },
    },
    pingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

liveLocationSessionSchema.index({ senderId: 1, status: 1 });

const LiveLocationSession = mongoose.model("LiveLocationSession", liveLocationSessionSchema);
export default LiveLocationSession;
