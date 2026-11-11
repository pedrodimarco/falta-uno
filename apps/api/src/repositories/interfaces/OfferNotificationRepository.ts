export interface OfferNotification {
  id: string;
  offerId: string;
  leaseToken: string;
  attempts: number;
  to: string;
  name: string;
  matchId: string;
  title: string;
  timeZone: string;
  expiresAt: number;
  createdAt: number;
}
export interface OfferNotificationRepository {
  enqueue(offerId: string, now: number): void;
  claimNext(
    now: number,
    leaseUntil: number,
    leaseToken: string,
  ): OfferNotification | null;
  markSent(id: string, leaseToken: string, now: number): void;
  retry(id: string, leaseToken: string, nextAttemptAt: number): void;
}
