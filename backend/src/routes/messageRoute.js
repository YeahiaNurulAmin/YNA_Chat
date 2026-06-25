import express from "express";
import {
  deleteMessage,
  forwardMessage,
  getConversationsForSidebar,
  getMessages,
  getUsersForSidebar,
  markConversationAsRead,
  sendMessage,
} from "../controllers/messageControl.js";
import { protectRoute } from "../Middlewares/authMiddelware.js";
import { upload, handleUploadError } from "../Middlewares/updateMiddelware.js";

const router = express.Router();

function uploadMessageMedia(req, res, next) {
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return next();
  }

  return upload.fields([
    { name: "media", maxCount: 10 },
    { name: "voice", maxCount: 1 },
  ])(req, res, next);
}

router.use(protectRoute);

//api/messages/users
router.get("/users", getUsersForSidebar);
//api/messages/conversations
router.get("/conversations", getConversationsForSidebar);
//api/messages/read/:id
router.patch("/read/:id", markConversationAsRead);
//api/messages/forward/:messageId
router.post("/forward/:messageId", forwardMessage);
//api/messages/item/:messageId
router.delete("/item/:messageId", deleteMessage);
//api/messages/send/:id — "media" up to 10 files, "voice" up to 1 voice note
router.post("/send/:id", uploadMessageMedia, sendMessage, handleUploadError);
//api/messages/:id
router.get("/:id", getMessages);

export default router;