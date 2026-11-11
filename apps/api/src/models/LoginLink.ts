export interface LoginLink {
  tokenHash: string;
  flowHash: string;
  email: string;
  name: string;
  returnTo: string;
  createdAt: number;
  expiresAt: number;
  consumedAt: number | null;
  legacyPersonId: string | null;
  legacySessionHash: string | null;
}
