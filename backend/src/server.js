import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import { installFetchProxy } from "./lib/proxy.js";
import { startCronJobs } from "./lib/cron.js";
import { clerkMiddleware } from '@clerk/express'
import fs from "fs";
import path from "path";
import clerkWebhookRouter from "./webhooks/clerkWebhookMiddleware.js";
import authRouter from "./routes/authRoute.js";
import messageRoute from "./routes/messageRoute.js";
import locationRoute from "./routes/locationRoute.js";
import callRoute from "./routes/callRoute.js";
import { app, server, } from "./lib/socket.js";

// Route fetch-based integrations (Clerk, ImageKit, LiveKit, Nominatim) and the
// keep-alive cron through the outbound proxy when one is configured.
installFetchProxy();


// Initialize Express app
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PUBLIC_DIR = path.join(process.cwd(), "public");// This is the directory where the static files are stored


// Middleware
// Set up Clerk webhook middleware
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhookRouter);
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

// Auth routes
app.use("/api/auth", authRouter);
app.use("/api/messages", messageRoute);
app.use("/api/location", locationRoute);
app.use("/api/calls", callRoute);


if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));// Serve static files from the public directory
  app.get("/{*any}", (req, res) => { // Serve the index.html file for all routes
    res.sendFile(path.join(PUBLIC_DIR, "index.html"), (err) => next(err)); // Send the index.html file for all routes if there is an error, call the next middleware
  });
}

// Start the server
server.listen(PORT, () => {
  connectDB();

  if (process.env.NODE_ENV === "production") {
    startCronJobs(PORT);
  }

  console.log("Server is up and running on PORT:", PORT);
});