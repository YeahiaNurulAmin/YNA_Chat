import User from "../models/User.js";
import Message from "../models/Message.js";
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export async function getUsersForSidebar(req, res) {
  try {
    const loggedInUserId = req.user._id; // get the logged in user's id

    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-clerkId"); // get all users except the logged in user and hide the clerkId field

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
      // 1. Keep only the messages I sent or received.
      { $match: { $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }] } },
      // 2. Collapse them into one row per chat partner, noting our latest message time.
      {
        $group: {
          // The partner is the other person on the message (not me).
          _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
          lastMessageAt: { $max: "$createdAt" },
        },
      },
      // 3. Put the most recent conversation at the top.
      { $sort: { lastMessageAt: -1 } },
      // 4. Look up each partner's user profile (comes back as an array).
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      // 5. Pull that profile out of the array and make it the document.
      { $replaceRoot: { newRoot: { $first: "$user" } } },
      // 6. Hide the private clerkId field from the result.
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
      $or: [ // $or is used to match any of the conditions
        { senderId: myId, receiverId: userToChatId }, // match the senderId and receiverId
        { senderId: userToChatId, receiverId: myId }, // match the senderId and receiverId
      ],
    }).sort({ createdAt: 1 }); // sort the messages by createdAt in ascending order to get the oldest messages first

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendMessage(req, res) {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const mediaFiles = req.files?.media ?? [];
    const voiceFiles = req.files?.voice ?? [];
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
    });

    await newMessage.save();


    const receiverSocketId = getReceiverSocketId(receiverId);// get the receiver's socket id
    // Only send the message to the receiver if they are online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}