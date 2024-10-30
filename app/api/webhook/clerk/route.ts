import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { createUser } from '@/lib/actions/user.actions';
import { NextResponse } from 'next/server';


export async function POST(req: Request) {
  try {
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
      console.log("Payload Data:", payload); // Log the incoming payload
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
          return NextResponse.json({ message: 'Invalid webhook signature'}, { status: 400 });
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

          // Check if email, username and handle null first_name/last_name
          const email = email_addresses[0]?.email_address || '';
          if (!email) {
              console.error("Email is required.");
              return NextResponse.json({ message: 'Email is required', evt }, { status: 400 });
          }

          const user = {
              clerkId: id,
              email: email,
              username: username || '',
              firstName: first_name || '',  // Handling NULL values
              lastName: last_name || '',      // Handling NULL values
              photo: image_url || '',
          };

          console.log("Creating User:", user); // Log user creation data
          const newUser = await createUser(user);

          if (!newUser) {
              return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
          }

          await clerkClient.users.updateUserMetadata(id, {
              publicMetadata: {
                  userId: newUser._id
              }
          });

          return NextResponse.json({ message: 'OK', user: newUser });
      }

      return new Response('', { status: 200 });
  } catch (error) {
      console.error('Unexpected error:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
