import "dotenv/config";
import dns from "dns";
import express from "express";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from '@clerk/express'

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";


// Set up DNS servers for MongoDB connection
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Middleware
// Set up CORS and JSON middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
// Set up JSON middleware
app.use(express.json());
// Set up Clerk middleware
app.use(clerkMiddleware())



app.get("/", (req, res) => {
  res.json({ message: "YNA Chat API is running at port " + PORT });
});

app.get("/health", (req, res) => {
  res.status(200).json({ message: "YNA Chat API is running at port " + PORT , ok: true});
});

// Start the server
app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});