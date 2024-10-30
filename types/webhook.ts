// types/webhook.ts
export interface UserWebhookData {
    id: string;
    email_addresses: { email_address: string }[];
    first_name?: string;
    last_name?: string;
    username?: string;
    image_url?: string;
  }
  
  // Add other interfaces for different event types as needed
  