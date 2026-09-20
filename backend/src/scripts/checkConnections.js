/**
 * Connectivity diagnostic for proxied environments.
 *
 * Verifies that every outbound integration in the app can actually reach its
 * provider through the configured proxy:
 *
 *   - fetch-based clients: Clerk, ImageKit, LiveKit, DNS-over-HTTPS, map tiles
 *   - SDK clients:         Clerk backend SDK, LiveKit RoomServiceClient
 *   - MongoDB:             DoH seedlist resolution + SOCKS5/HTTP tunnel + ping
 *
 * Usage: npm run check:connections
 * Exit code is 1 when any check fails, so it can be used in CI or as a
 * pre-flight step before starting the server.
 */

import "dotenv/config";
import mongoose from "mongoose";
import {
  describeProxySetup,
  installFetchProxy,
  prepareMongoConnection,
} from "../lib/proxy.js";

const results = [];

// Override with CONNECTIVITY_TIMEOUT_MS for slow links or fast CI runs.
const TIMEOUT_MS = Number(process.env.CONNECTIVITY_TIMEOUT_MS) || 25000;

function record(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function section(title) {
  console.log(`\n${"=".repeat(12)} ${title} ${"=".repeat(12)}`);
}

section("PROXY SETUP");
installFetchProxy();
console.log(describeProxySetup());

section("FETCH-BASED SERVICES");
const fetchTargets = [
  ["Clerk API", "https://api.clerk.com/v1/health"],
  ["ImageKit API", "https://api.imagekit.io/"],
  ["LiveKit Cloud", `${(process.env.LIVEKIT_URL || "").replace(/^ws/, "http")}/`],
  ["DNS-over-HTTPS", "https://dns.google/resolve?name=example.com&type=A"],
  ["OpenStreetMap tiles", "https://tile.openstreetmap.org/0/0/0.png"],
];

for (const [name, url] of fetchTargets) {
  if (!url || url === "/") {
    record(name, false, "not configured");
    continue;
  }

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    // 404 still proves the host is reachable through the proxy.
    record(name, true, `HTTP ${response.status}`);
  } catch (error) {
    record(name, false, error.cause?.code || error.message);
  }
}

section("SDK CLIENTS");
try {
  const { RoomServiceClient } = await import("livekit-server-sdk");
  const service = new RoomServiceClient(
    process.env.LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
  );
  const rooms = await service.listRooms();
  record("LiveKit SDK listRooms()", true, `${rooms.length} active room(s)`);
} catch (error) {
  record("LiveKit SDK listRooms()", false, error.message);
}

try {
  const { clerkClient } = await import("@clerk/express");
  const users = await clerkClient.users.getUserList({ limit: 1 });
  record("Clerk SDK users.getUserList()", true, `${users.totalCount ?? "?"} user(s)`);
} catch (error) {
  record("Clerk SDK users.getUserList()", false, error.message);
}

section("MONGODB");
try {
  const { uri, options, proxied } = await prepareMongoConnection(process.env.MONGODB_URI);
  console.log(`proxied: ${proxied} | options: ${JSON.stringify(options)}`);

  await mongoose.connect(uri, { ...options, serverSelectionTimeoutMS: TIMEOUT_MS });
  const ping = await mongoose.connection.db.admin().command({ ping: 1 });
  record("MongoDB ping", ping.ok === 1, `ok=${ping.ok}`);

  const collections = await mongoose.connection.db.listCollections().toArray();
  record(
    "MongoDB listCollections()",
    true,
    collections.length ? collections.map((entry) => entry.name).join(", ") : "no collections yet",
  );

  const users = await mongoose.connection.db.collection("users").countDocuments();
  record("MongoDB users.countDocuments()", true, `${users} document(s)`);

  await mongoose.disconnect();
} catch (error) {
  record("MongoDB connection", false, error.message);
}

section("SUMMARY");
const failed = results.filter((entry) => !entry.ok);
console.log(`${results.length - failed.length}/${results.length} checks passed`);

if (failed.length) {
  console.log(`Failed: ${failed.map((entry) => entry.name).join(", ")}`);
  process.exitCode = 1;
}
