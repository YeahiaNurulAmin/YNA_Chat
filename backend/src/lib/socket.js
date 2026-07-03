import express from "express";
import http from "http";
import { Server } from "socket.io";
import { verifyToken } from "@clerk/backend";
import { findOrSyncUser } from "./syncClerkUser.js";
import {
  endCallForUser,
  registerCallSocketHandlers,
} from "./callSignaling.js";

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

const userSocketMap = {};

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload?.sub) {
      next(new Error("Unauthorized"));
      return;
    }

    const user = await findOrSyncUser(payload.sub);
    if (!user) {
      next(new Error("User not synced"));
      return;
    }

    socket.data.userId = String(user._id);
    next();
  } catch (error) {
    console.error("Socket auth failed:", error.message);
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;

  userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  registerCallSocketHandlers(socket, io, getReceiverSocketId);

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    void endCallForUser(io, getReceiverSocketId, userId, "disconnected");
  });
});

const getReceiverSocketId = (receiverId) => {
  return userSocketMap[String(receiverId)];
};

export { app, server, io, getReceiverSocketId };
