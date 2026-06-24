import User from "../models/User.js";
import Message from "../models/Message.js";
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";
import { deliverMessage } from "../lib/deliverMessage.js";
import { getLocationService } from "../services/location/locationService.js";
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
    const loggedInUserId = req.user._id;

    const conversations = await Message.aggregate([
      { $match: { $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }] } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
          lastMessageAt: { $max: "$createdAt" },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $replaceRoot: { newRoot: { $first: "$user" } } },
      { $project: { clerkId: 0 } },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getConversationsForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMessages(req, res) {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

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

export async function sendMessage(req, res) {
  try {
    const { text, location: rawLocation, liveSessionId: rawLiveSessionId } = req.body;
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

    const newMessage = new Message({
      senderId,
      receiverId,
      text: trimmedText || undefined,
      image,
      video,
      voice,
      audio,
      document,
      ...(liveSessionId && !rawLocation ? { liveSessionId } : {}),
    });
    const saved = await deliverMessage(newMessage, receiverId);

    res.status(201).json(saved);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
