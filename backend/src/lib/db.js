import mongoose from "mongoose";

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
