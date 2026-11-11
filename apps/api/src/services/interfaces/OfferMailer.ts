export interface OfferEmail {
  notificationId: string;
  createdAt: number;
  to: string;
  name: string;
  title: string;
  url: string;
  expiresAt: string;
  timeZone: string;
}
export interface OfferMailer {
  readonly deliveryMode: "local" | "email";
  send(message: OfferEmail): Promise<void>;
}
