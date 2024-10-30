import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, deleteUser, updateUser } from "@/lib/actions/user.actions";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextResponse } from "next/server";
import { UserWebhookData } from "@/types/webhook";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- missing svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Verification error", { status: 400 });
  }

  const { type: eventType, data } = evt;

  const userData = data as UserWebhookData;

  if (eventType === "user.created") {
    const email_addresses = userData.email_addresses || [];
    const user = {
      clerkId: userData.id,
      email: email_addresses[0]?.email_address || "",
      username: userData.username || "",
      firstName: userData.first_name || "",
      lastName: userData.last_name || "",
      photo: userData.image_url || "",
    };

    const newUser = await createUser(user);

    if (newUser) {
      await clerkClient.users.updateUserMetadata(userData.id, {
        publicMetadata: {
          userId: newUser._id,
        },
      });
    }

    return NextResponse.json({ message: "User created", user: newUser });
  }

  if (eventType === "user.updated") {
    const user = {
      firstName: userData.first_name || "",
      lastName: userData.last_name || "",
      username: userData.username || "",
      photo: userData.image_url || "",
    };

    const updatedUser = await updateUser(userData.id, user);
    return NextResponse.json({ message: "User updated", user: updatedUser });
  }

  if (eventType === "user.deleted") {
    await deleteUser(userData.id);
    return NextResponse.json({ message: "User deleted" });
  }

  return new Response("Unhandled event type", { status: 200 });
}
