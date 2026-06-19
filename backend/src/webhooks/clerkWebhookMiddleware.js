import express from "express";
import User from "../models/User.js";
import { verifyWebhook } from "@clerk/express/webhooks";

const router = express.Router();

router.post("/", async (req, res) => {
  let evt;

  try {
    evt = await verifyWebhook(req);
  } catch (error) {
    console.error("[clerk webhook] Verification failed:", error.message);
    return res.status(400).json({ message: "Webhook verification failed" });
  }

  try {
    console.log(`[clerk webhook] Received event: ${evt.type}`);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const u = evt.data;

      const email =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
          ?.email_address ?? u.email_addresses?.[0]?.email_address;

      if (!email) {
        console.warn(`[clerk webhook] Skipping user ${u.id}: no email`);
        return res.status(200).json({ received: true, skipped: true });
      }

      const fullName =
        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
        u.username ||
        email.split("@")[0];

      await User.findOneAndUpdate(
        { clerkId: u.id },
        {
          clerkId: u.id,
          email,
          fullName,
          profilePicture: u.image_url ?? "",
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      console.log(`[clerk webhook] User synced: ${u.id} (${email})`);
    }

    if (evt.type === "user.deleted") {
      if (evt.data.id) {
        await User.findOneAndDelete({ clerkId: evt.data.id });
        console.log(`[clerk webhook] User deleted: ${evt.data.id}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[clerk webhook] Handler failed:", error);
    res.status(500).json({ message: "Webhook handler failed" });
  }
});

export default router;
