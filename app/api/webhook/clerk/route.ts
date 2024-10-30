import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent} from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { createUser,  } from '@/lib/actions/user.actions'
import { NextResponse } from 'next/server'
 
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', { status: 400 });
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
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', { status: 400 });
  }

  console.log("Webhook Event Data:", evt.data); // Log the event data

  const eventType = evt.type;
  if (eventType === 'user.created') {
    const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

    // Validate fields before creating user
    if (!id || !email_addresses || !email_addresses.length) {
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

    console.log("Creating User:", user); // Log user creation data
    const newUser = await createUser(user);

    if(newUser) {
      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: {
          userId: newUser._id
        }
      })
    }

    return NextResponse.json({ message: 'OK', user: newUser })
  }
  
  // Handle other events...
  return new Response('', { status: 200 });
}
