import crypto from "crypto";
import User from "../models/User.js";
import { io, getReceiverSocketId } from "../lib/socket.js";
import { createCallRoom, deleteRoom, isLivekitConfigured, mintRoomToken } from "../lib/livekit.js";
import {
  acceptCallSignaling,
  cleanupCall,
  getActiveCallForUser,
  getCallById,
  findCallByRoomName,
  registerCall,
  rejectCall,
} from "../lib/callSignaling.js";

function formatCaller(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    profilePic: user.profilePicture,
  };
}

function livekitUnavailable(res) {
  res.status(503).json({ message: "Voice calling is not configured" });
}

export async function inviteCall(req, res) {
  try {
    if (!isLivekitConfigured()) return livekitUnavailable(res);

    const callerId = String(req.user._id);
    const { peerId } = req.body;

    if (!peerId) {
      res.status(400).json({ message: "peerId is required" });
      return;
    }

    if (String(peerId) === callerId) {
      res.status(400).json({ message: "Cannot call yourself" });
      return;
    }

    if (getActiveCallForUser(callerId) || getActiveCallForUser(peerId)) {
      res.status(409).json({ message: "User is already in a call" });
      return;
    }

    const calleeSocketId = getReceiverSocketId(peerId);
    if (!calleeSocketId) {
      res.status(409).json({ message: "User is offline" });
      return;
    }

    const [callee, caller] = await Promise.all([
      User.findById(peerId).select("fullName profilePicture"),
      User.findById(callerId).select("fullName profilePicture"),
    ]);

    if (!callee) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const callId = crypto.randomUUID();
    const roomName = `call-${callId}`;

    await createCallRoom(roomName);

    const token = await mintRoomToken({
      identity: callerId,
      name: req.user.fullName,
      roomName,
    });

    const call = {
      callId,
      roomName,
      callerId,
      calleeId: String(peerId),
      status: "ringing",
    };

    registerCall(call);

    io.to(calleeSocketId).emit("call:incoming", {
      callId,
      roomName,
      caller: formatCaller(caller ?? req.user),
    });

    res.status(200).json({ callId, roomName, token });
  } catch (error) {
    console.error("Error in inviteCall:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function acceptCall(req, res) {
  try {
    if (!isLivekitConfigured()) return livekitUnavailable(res);

    const calleeId = String(req.user._id);
    const { callId } = req.body;

    if (!callId) {
      res.status(400).json({ message: "callId is required" });
      return;
    }

    const call = getCallById(callId);
    if (!call || String(call.calleeId) !== calleeId) {
      res.status(404).json({ message: "Call not found" });
      return;
    }

    if (call.status !== "ringing") {
      res.status(409).json({ message: "Call is no longer available" });
      return;
    }

    const token = await mintRoomToken({
      identity: calleeId,
      name: req.user.fullName,
      roomName: call.roomName,
    });

    await acceptCallSignaling(io, getReceiverSocketId, call);

    res.status(200).json({ roomName: call.roomName, token });
  } catch (error) {
    console.error("Error in acceptCall:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectCallHandler(req, res) {
  try {
    const calleeId = String(req.user._id);
    const { callId } = req.body;

    if (!callId) {
      res.status(400).json({ message: "callId is required" });
      return;
    }

    const call = getCallById(callId);
    if (!call || String(call.calleeId) !== calleeId) {
      res.status(404).json({ message: "Call not found" });
      return;
    }

    await rejectCall(io, getReceiverSocketId, call, calleeId);
    res.status(200).json({ message: "Call rejected" });
  } catch (error) {
    console.error("Error in rejectCall:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function endCallHandler(req, res) {
  try {
    const userId = String(req.user._id);
    const { callId, roomName } = req.body;

    let call = callId ? getCallById(callId) : getActiveCallForUser(userId);
    if (!call && roomName) {
      call = findCallByRoomName(roomName);
    }

    if (call) {
      if (![String(call.callerId), String(call.calleeId)].includes(userId)) {
        res.status(403).json({ message: "Not a participant in this call" });
        return;
      }
      await cleanupCall(io, getReceiverSocketId, call, "ended", userId);
    } else if (roomName) {
      await deleteRoom(roomName);
    }

    res.status(200).json({ message: "Call ended" });
  } catch (error) {
    console.error("Error in endCall:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
