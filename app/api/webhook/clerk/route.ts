import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUser } from '@/lib/actions/user.actions';
import { clerkClient } from '@clerk//clerk-sdk-node';
import { NextResponse } from 'next/server';
import { UserWebhookData } from '@/types/webhook';

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Get the ID and type
  // const { id: userId } = evt.data; // Using the ID for user reference
  const eventType = evt.type;

  // Handle the different event types
  if (eventType === 'user.created') {
    const userData = evt.data as UserWebhookData; // Type assertion
    const email_addresses = userData.email_addresses || [];

    const user = {
      clerkId: userData.id || '', // Ensure not undefined
      email: email_addresses.length > 0 ? email_addresses[0].email_address : '',
      username: userData.username || '',
      firstName: userData.first_name || '',
      lastName: userData.last_name || '',
      photo: userData.image_url || '',
    };

    const newUser = await createUser(user);

    if (newUser) {
      await clerkClient.users.updateUserMetadata(userData.id, {
        publicMetadata: {
          userId: newUser._id,
        },
      });
    }

    return NextResponse.json({ message: 'OK', user: newUser });
  }

  // if (eventType === 'user.updated') {
  //   const userData = evt.data as UserWebhookData; // Type assertion

  //   const user = {
  //     firstName: userData.first_name || '',
  //     lastName: userData.last_name || '',
  //     username: userData.username || '',
  //     photo: userData.image_url || '',
  //   };

  //   const updatedUser = await updateUser(userId, user);

  //   return NextResponse.json({ message: 'OK', user: updatedUser });
  // }

  // if (eventType === 'user.deleted') {
  //   const deletedUser = await deleteUser(userId);

  //   return NextResponse.json({ message: 'OK', user: deletedUser });
  // }

  // return new Response('', { status: 200 });
}
