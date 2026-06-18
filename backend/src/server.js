import "dotenv/config";
import dns from "dns";
import express from "express";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from '@clerk/express'
import fs from "fs";
import path from "path";


// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PUBLIC_DIR = path.join(process.cwd(), "public");// This is the directory where the static files are stored


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


//Routes
// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ message: "YNA Chat API is running at port " + PORT , ok: true});
});


if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));// Serve static files from the public directory
  app.get("/{*any}", (req, res) => { // Serve the index.html file for all routes
    res.sendFile(path.join(PUBLIC_DIR, "index.html"), (err) => next(err)); // Send the index.html file for all routes if there is an error, call the next middleware
  });
}

// Start the server
app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});