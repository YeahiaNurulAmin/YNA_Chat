import express from "express";
import http from "http";
import { Server } from "socket.io";


const app = express();
const server = http.createServer(app);// why we use this? because socket.io is a websocket library and it needs a http server to work and express is a web framework for node.js

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

//Need to check
const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
});

const userSocketMap = {};// This is a map of user id to socket id this how it looks like { userId: socketId } = { "666666666666666666666666": "1234567890" }

io.on("connection", (socket) => { // from where getting this socket? from the client side when the client connects to the server
    const userId = socket.handshake.query.userId;

    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));// waht emit does? it emits the online users to all connected clients(all users) by giving it users ids array

    io.on("disconnect", () => {
        delete userSocketMap[userId];// delete the user from the map
        io.emit("getOnlineUsers", Object.keys(userSocketMap)); //
    });
});

const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

export { app, server, io, getReceiverSocketId };