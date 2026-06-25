import User from "../models/User.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";
import { deliverMessage, emitMessageDeleted } from "../lib/deliverMessage.js";
import { getLocationService } from "../services/location/locationService.js";

function toObjectId(id) {
  return id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id));
}

export async function getUsersForSidebar(req, res) {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-clerkId");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getConversationsForSidebar(req, res) {
  try {
    const loggedInUserId = toObjectId(req.user._id); // toObjectId is a function that converts a string to a mongoose ObjectId

    const conversations = await Message.aggregate([
      { $match: { $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", loggedInUserId] },
                    { $eq: [{ $ifNull: ["$readAt", null] }, null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          fullName: "$user.fullName",
          profilePic: "$user.profilePicture",
          email: "$user.email",
          lastMessage: {
            _id: "$lastMessage._id",
            text: "$lastMessage.text",
            image: "$lastMessage.image",
            video: "$lastMessage.video",
            voice: "$lastMessage.voice",
            audio: "$lastMessage.audio",
            document: "$lastMessage.document",
            location: "$lastMessage.location",
            isLiveLocation: "$lastMessage.isLiveLocation",
            liveSessionId: "$lastMessage.liveSessionId",
            senderId: "$lastMessage.senderId",
            receiverId: "$lastMessage.receiverId",
            createdAt: "$lastMessage.createdAt",
          },
          unreadCount: 1,
        },
      },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getConversationsForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function markConversationAsRead(req, res) {
  try {
    const { id: peerId } = req.params;
    const myId = req.user._id;

    const result = await Message.updateMany(
      { senderId: peerId, receiverId: myId, readAt: null },
      { $set: { readAt: new Date() } },
    );

    res.status(200).json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error in markConversationAsRead:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMessages(req, res) {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, readAt: null },
      { $set: { readAt: new Date() } },
    );

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

function parseReplyTo(rawReplyTo) {
  if (!rawReplyTo || typeof rawReplyTo !== "object") return null;

  const messageId = rawReplyTo.messageId;
  const text = typeof rawReplyTo.text === "string" ? rawReplyTo.text.trim() : "";
  const senderName =
    typeof rawReplyTo.senderName === "string" ? rawReplyTo.senderName.trim() : "";

  if (!messageId || !text) return null;

  return {
    messageId,
    text: text.slice(0, 500),
    senderName: senderName || "Message",
  };
}

export async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const myId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(message.senderId) !== String(myId)) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await Message.deleteOne({ _id: message._id });

    emitMessageDeleted({
      messageId: message._id,
      senderId: message.senderId,
      receiverId: message.receiverId,
    });

    res.status(200).json({ ok: true, messageId: String(message._id) });
  } catch (error) {
    console.error("Error in deleteMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function forwardMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver is required" });
    }

    if (String(receiverId) === String(senderId)) {
      return res.status(400).json({ message: "You cannot forward a message to yourself" });
    }

    const original = await Message.findById(messageId);
    if (!original) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isParticipant =
      String(original.senderId) === String(senderId) ||
      String(original.receiverId) === String(senderId);

    if (!isParticipant) {
      return res.status(403).json({ message: "You cannot forward this message" });
    }

    const receiver = await User.findById(receiverId).select("_id");
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: original.text,
      image: original.image,
      video: original.video,
      voice: original.voice,
      audio: original.audio,
      document: original.document,
      ...(original.location && !original.isLiveLocation ? { location: original.location } : {}),
    });

    const saved = await deliverMessage(newMessage, receiverId);

    res.status(201).json(
      typeof saved.toObject === "function" ? saved.toObject() : saved,
    );
  } catch (error) {
    console.error("Error in forwardMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendMessage(req, res) {
  try {
    const { text, location: rawLocation, liveSessionId: rawLiveSessionId, replyTo: rawReplyTo } =
      req.body;
    const isLiveLocation =
      req.body.isLiveLocation === true || req.body.isLiveLocation === "true";
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const liveSessionId =
      typeof rawLiveSessionId === "string" ? rawLiveSessionId.trim() : undefined;

    const locationService = getLocationService();

    // Backward-compatible delegation for clients still posting location via /messages/send
    if (isLiveLocation && liveSessionId && rawLocation) {
      const result = await locationService.pingLiveSession({
        senderId,
        sessionId: liveSessionId,
        rawLocation,
      });

      if (result.error) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      if (result.skipped) {
        return res.status(200).json({ skipped: true, session: result.session });
      }

      return res.status(201).json(result.message);
    }

    if (rawLocation && !isLiveLocation) {
      const result = await locationService.sendStaticLocation({
        senderId,
        receiverId,
        rawLocation,
      });

      if (result.error) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      return res.status(201).json(result.message);
    }

    if (rawLocation || (isLiveLocation && !liveSessionId)) {
      return res.status(400).json({
        message: "Invalid location payload. Use /api/location/send or /api/location/live/* endpoints.",
      });
    }

    const mediaFiles = req.files?.media ?? [];    const voiceFiles = req.files?.voice ?? [];
    const allFiles = [...mediaFiles, ...voiceFiles];

    const image = [];
    const video = [];
    const voice = [];
    const audio = [];
    const document = [];

    const trimmedText = typeof text === "string" ? text.trim() : "";

    if (allFiles.length > 0) {
      if (!hasImageKitConfig()) {
        return res.status(500).json({ message: "Media upload is not configured" });
      }

      for (const file of voiceFiles) {
        const url = await uploadChatMedia(file);
        voice.push(url);
      }

      for (const file of mediaFiles) {
        const url = await uploadChatMedia(file);

        if (file.mimetype.startsWith("image/")) image.push(url);
        else if (file.mimetype.startsWith("video/")) video.push(url);
        else if (file.mimetype.startsWith("audio/")) audio.push(url);
        else document.push(url);
      }
    }

    const hasContent =
      trimmedText ||
      image.length > 0 ||
      video.length > 0 ||
      voice.length > 0 ||
      audio.length > 0 ||
      document.length > 0;

    if (!hasContent) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const replyTo = parseReplyTo(rawReplyTo);

    const newMessage = new Message({
      senderId,
      receiverId,
      text: trimmedText || undefined,
      image,
      video,
      voice,
      audio,
      document,
      ...(replyTo ? { replyTo } : {}),
      ...(liveSessionId && !rawLocation ? { liveSessionId } : {}),
    });
    const saved = await deliverMessage(newMessage, receiverId);

    res.status(201).json(
      typeof saved.toObject === "function" ? saved.toObject() : saved,
    );
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
