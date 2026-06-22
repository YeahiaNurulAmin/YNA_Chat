import express from "express";
import { checkAuth } from "../controllers/authControl.js";
import { protectRoute } from "../Middlewares/authMiddelware.js";

const router = express.Router();
// 
router.get("/check", protectRoute, checkAuth);

export default router;