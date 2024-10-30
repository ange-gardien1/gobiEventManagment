import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, updateUser, deleteUser } from "@/lib/actions/user.actions";
import { UserWebhookData } from "@/types/webhook";

export const POST = async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  const event = (await req.json()) as WebhookEvent;
  const { type, data } = event;

  switch (type) {
    case "user.created":
      await handleUserCreated(data as UserWebhookData);
      break;
    case "user.updated":
      await handleUserUpdated(data as UserWebhookData);
      break;
    case "user.deleted":
      await handleUserDeleted(data);
      break;
    default:
      console.warn("Unhandled event type:", type);
      return new Response(
        JSON.stringify({ message: "Event type not handled" }),
        {
          status: 200,
        }
      );
  }

  return new Response(
    JSON.stringify({ message: "Webhook processed successfully" }),
    {
      status: 200,
    }
  );
};

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

async function handleUserDeleted(data: { id?: string }) {
  if (data.id) {
    await deleteUser(data.id);
  } else {
    console.error("User ID is missing in deletion event data");
  }
}
