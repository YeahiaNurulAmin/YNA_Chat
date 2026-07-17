import express from "express";
import {
  acceptCall,
  endCallHandler,
  inviteCall,
  rejectCallHandler,
} from "../controllers/callControl.js";
import { protectRoute } from "../Middlewares/authMiddelware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/invite", inviteCall);
router.post("/accept", acceptCall);
router.post("/reject", rejectCallHandler);
router.post("/end", endCallHandler);

export default router;
