import { NextApiRequest, NextApiResponse } from "next";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, updateUser, deleteUser } from "@/lib/actions/user.actions";
import { UserWebhookData } from "@/types/webhook";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error("Please add WEBHOOK_SECRET to your environment variables.");
}

const webhook = new Webhook(WEBHOOK_SECRET);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { headers } = req;
  const svixId = headers["svix-id"] as string | undefined;
  const svixTimestamp = headers["svix-timestamp"] as string | undefined;
  const svixSignature = headers["svix-signature"] as string | undefined;

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: "Missing svix headers" });
  }

  const body = JSON.stringify(req.body);

  let event: WebhookEvent;

  try {
    event = webhook.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const { type, data } = event;

  switch (type) {
    case "user.created":
      await handleUserCreated(data as UserWebhookData);
      break;
    case "user.updated":
      await handleUserUpdated(data as UserWebhookData);
      break;
    case "user.deleted":
      if (data.id) {
        await handleUserDeleted({ id: data.id });
      } else {
        console.error("User ID is missing in deletion event data");
      }
      break;
    default:
      console.warn("Unhandled event type:", type);
      return res.status(200).json({ message: "Event type not handled" });
  }

  return res.status(200).json({ message: "Webhook processed successfully" });
}

async function handleUserCreated(data: UserWebhookData) {
  const user = {
    clerkId: data.id,
    email: data.email_addresses[0].email_address,
    username: data.username || "",
    firstName: data.first_name || "",
    lastName: data.last_name || "",
    photo: data.image_url || "",
  };

  await createUser(user);
}

async function handleUserUpdated(data: UserWebhookData) {
  const user = {
    firstName: data.first_name || "",
    lastName: data.last_name || "",
    username: data.username || "",
    photo: data.image_url || "",
  };

  await updateUser(data.id, user);
}

async function handleUserDeleted(data: { id: string }) {
  await deleteUser(data.id);
}
