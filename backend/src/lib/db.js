import dns from "dns";
import mongoose from "mongoose";

// Atlas SRV lookups can fail with the system DNS resolver on some networks.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

export const connectDB = async () => {
    try {
        const dbBaseUrl = process.env.MONGODB_URI;
        
        if (!dbBaseUrl) {
            throw new Error("MongoDB URI is not defined in the environment variables");
        }

       const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected successfully to ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1); //Exit with failure code 1 means failure
    }
}
