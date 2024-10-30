// types.ts
export interface EmailAddress {
  email_address: string;
}

export interface UserCreatedEventData {
  id: string;
  email_addresses: EmailAddress[];
  image_url?: string; // Optional
  first_name: string;
  last_name: string;
  username: string;
}

export interface UserUpdatedEventData {
  id: string;
  image_url?: string; // Optional
  first_name: string;
  last_name: string;
  username: string;
}

export interface UserDeletedEventData {
  id: string;
}

export interface User {
  clerkId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  photo?: string; // Optional
}
