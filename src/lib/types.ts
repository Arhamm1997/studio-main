export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "Pending" | "Sent" | "Error";
  sentTimestamp: string | null;
  openTimestamp: string | null;
}

export interface Campaign {
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
}

export interface Analytics {
  total: number;
  sent: number;
  pending: number;
  errors: number;
  opened: number;
  openRate: number;
  sentRate: number;
}
