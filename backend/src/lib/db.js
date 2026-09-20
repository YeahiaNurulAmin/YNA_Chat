import dns from "node:dns";
import mongoose from "mongoose";
import { backfillReadAt } from "../migrations/backfillReadAt.js";
import { describeProxySetup, prepareMongoConnection } from "./proxy.js";

// Optional DNS override for networks whose resolver cannot answer Atlas SRV queries.
// Left unset by default: forcing a public resolver here (e.g. 8.8.8.8) makes SRV
// lookups hang on networks where only the local resolver is reachable.
if (process.env.MONGODB_DNS_SERVERS) {
    const servers = process.env.MONGODB_DNS_SERVERS.split(",")
        .map((server) => server.trim())
        .filter(Boolean);

    if (servers.length) dns.setServers(servers);
}

export const connectDB = async () => {
    try {
        const dbBaseUrl = process.env.MONGODB_URI;

        if (!dbBaseUrl) {
            throw new Error("MongoDB URI is not defined in the environment variables");
        }

        console.log(describeProxySetup());

        // Routes the connection through the outbound proxy when one is configured.
        const { uri, options } = await prepareMongoConnection(dbBaseUrl);

        const conn = await mongoose.connect(uri, options);
        console.log(`MongoDB connected successfully to ${conn.connection.host}`);
        try {
            await backfillReadAt(); // backfillReadAt is a function that backfills the readAt field in the Message model
        } catch (error) {
            console.error("readAt backfill failed:", error.message);
        }
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1); //Exit with failure code 1 means failure
    }
}

