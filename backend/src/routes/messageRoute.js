import express from "express";
import {
  getConversationsForSidebar,
  getMessages,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/messageControl.js";
import { protectRoute } from "../Middlewares/authMiddelware.js";
import { upload, handleUploadError } from "../Middlewares/updateMiddelware.js";

const router = express.Router();

router.use(protectRoute);// protect the route so that only authenticated users can access it

//api/messages/users
router.get("/users", getUsersForSidebar);
//api/messages/conversations    
router.get("/conversations", getConversationsForSidebar);
//api/messages/:id
router.get("/:id", getMessages);
//api/messages/send/:id — "media" up to 10 files, "voice" up to 1 voice note
router.post(
  "/send/:id",
  upload.fields([
    { name: "media", maxCount: 10 },
    { name: "voice", maxCount: 1 },
  ]),
  sendMessage
);

router.use(handleUploadError);

export default router;