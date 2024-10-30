import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { createUser } from '@/lib/actions/user.actions';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing WEBHOOK_SECRET');
    return NextResponse.json({ message: 'Missing WEBHOOK_SECRET' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing SVIX headers');
    return NextResponse.json({ message: 'Missing SVIX headers' }, { status: 400 });
  }

  const payload = await req.json();
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ message: 'Invalid webhook signature' }, { status: 400 });
  }

  console.log("Webhook Event Data:", evt.data); // Log the event data
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

    // Validate fields before creating user
    if (!id || !email_addresses?.length) {
      console.error("Invalid user data:", evt.data);
      return NextResponse.json({ message: 'Invalid user data', evt }, { status: 400 });
    }

    const user = {
      clerkId: id,
      email: email_addresses[0].email_address,
      username: username || '',
      firstName: first_name || '',
      lastName: last_name || '',
      photo: image_url || '',
    };

    console.log("Creating User:", user);
    const newUser = await createUser(user);

    if (newUser) {
      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: {
          userId: newUser._id
        }
      });
    }

    return NextResponse.json({ message: 'User created successfully', user: newUser });
  }

  // Handle other events...
  return NextResponse.json({ message: 'Event processed successfully' }, { status: 200 });
}
