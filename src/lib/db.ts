import type { Contact, Campaign } from './types';

interface Db {
  contacts: Contact[];
  campaign: Campaign;
}

// In-memory "database"
export const db: Db = {
  contacts: [],
  campaign: {
    subject: "Hello {{firstName}}, Important Message for you",
    body: `Dear {{firstName}} {{lastName}},

We hope this message finds you well!

We wanted to share something important with you about BAGGA BUGS - our new email solution. It's designed to be powerful and easy to use.

Learn more on our website.

Best regards,
The Professional Team`,
    senderName: "The Bagga Bugs Team",
    senderEmail: "contact@baggabugs.dev",
    replyTo: "reply@baggabugs.dev"
  }
};
