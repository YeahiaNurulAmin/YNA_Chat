import express from "express";
import { protectRoute } from "../Middlewares/authMiddelware.js";
import {
  getActiveLiveSession,
  getLocationConfig,
  pingLiveSession,
  sendStaticLocation,
  startLiveSession,
  stopLiveSession,
} from "../controllers/locationControl.js";

const router = express.Router();

router.use(protectRoute);

router.get("/config", getLocationConfig);
router.post("/send/:id", sendStaticLocation);
router.get("/live/active", getActiveLiveSession);
router.post("/live/start", startLiveSession);
router.post("/live/:sessionId/ping", pingLiveSession);
router.post("/live/:sessionId/stop", stopLiveSession);

export default router;
