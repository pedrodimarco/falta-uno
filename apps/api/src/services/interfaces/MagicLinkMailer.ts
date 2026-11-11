export interface LoginEmail {
  to: string;
  name: string;
  url: string;
  expiresAt: string;
}

export interface MagicLinkMailer {
  readonly deliveryMode: "local" | "email";
  send(message: LoginEmail): Promise<void>;
}
