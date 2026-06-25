import Message from "../models/Message.js";

export async function backfillReadAt() {
  const result = await Message.updateMany(
    { readAt: { $exists: false } },
    [{ $set: { readAt: "$createdAt" } }],
    { updatePipeline: true },
  );

  if (result.modifiedCount > 0) {
    console.log(`Backfilled readAt on ${result.modifiedCount} existing messages`);
  }
}
