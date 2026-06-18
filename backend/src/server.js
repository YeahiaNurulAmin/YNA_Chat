import "dotenv/config";
import dns from "dns";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "" //Needs to change

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.json({ message: "YNA Chat API is running at port " + PORT });
});


mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MongoDB connected and Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });

console.log("MONGODB_URI = ", process.env.MONGODB_URI);