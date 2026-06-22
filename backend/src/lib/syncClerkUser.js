import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

function getClerkEmail(clerkUser) {
  return (
    clerkUser.emailAddresses?.find((entry) => entry.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses?.[0]?.emailAddress
  );
}

function getClerkFullName(clerkUser, email) {
  return (
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    email.split("@")[0]
  );
}

function buildUserPayload(clerkUser) {
  const email = getClerkEmail(clerkUser);
  if (!email) return null;

  return {
    clerkId: clerkUser.id,
    email,
    fullName: getClerkFullName(clerkUser, email),
    profilePicture: clerkUser.imageUrl ?? "",
  };
}

export async function upsertUserFromPayload(payload) {
  const existingByEmail = await User.findOne({ email: payload.email });
  if (existingByEmail) {
    return User.findOneAndUpdate({ _id: existingByEmail._id }, payload, {
      returnDocument: "after",
    });
  }

  try {
    return await User.findOneAndUpdate({ clerkId: payload.clerkId }, payload, {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    });
  } catch (error) {
    if (error.code === 11000) {
      return User.findOne({ email: payload.email });
    }
    throw error;
  }
}

export async function findOrSyncUser(clerkId) {
  const existingByClerkId = await User.findOne({ clerkId });
  if (existingByClerkId) return existingByClerkId;

  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const payload = buildUserPayload(clerkUser);
    if (!payload) return null;

    return await upsertUserFromPayload(payload);
  } catch (error) {
    console.error("Error syncing Clerk user:", error.message);
    return null;
  }
}
