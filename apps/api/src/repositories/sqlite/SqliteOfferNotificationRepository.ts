import type { DatabaseSync } from "node:sqlite";
import type {
  OfferNotification,
  OfferNotificationRepository,
} from "../interfaces/OfferNotificationRepository.ts";
export class SqliteOfferNotificationRepository implements OfferNotificationRepository {
  constructor(private readonly database: DatabaseSync) {}
  enqueue(offerId: string, now: number): void {
    this.database
      .prepare(
        "INSERT OR IGNORE INTO offer_notifications (id,offer_id,created_at,next_attempt_at) VALUES (?,?,?,?)",
      )
      .run(offerId, offerId, now, now);
  }
  claimNext(
    now: number,
    leaseUntil: number,
    leaseToken: string,
  ): OfferNotification | null {
    this.database
      .prepare(
        `UPDATE offer_notifications SET discarded_at=? WHERE sent_at IS NULL AND discarded_at IS NULL AND offer_id IN (
      SELECT w.id FROM waitlist_entries w JOIN matches m ON m.id=w.match_id WHERE w.status!='offered' OR w.expires_at<=? OR m.starts_at<=?
    )`,
      )
      .run(now, now, new Date(now).toISOString());
    const row = this.database
      .prepare(
        `SELECT n.*,w.match_id,w.expires_at,p.name,a.email,m.title,m.time_zone FROM offer_notifications n
      JOIN waitlist_entries w ON w.id=n.offer_id JOIN people p ON p.id=w.person_id
      JOIN email_accounts a ON a.person_id=w.person_id JOIN matches m ON m.id=w.match_id
      WHERE n.sent_at IS NULL AND n.discarded_at IS NULL AND n.next_attempt_at<=? AND (n.lease_until IS NULL OR n.lease_until<=?)
      AND w.status='offered' AND w.expires_at>? AND m.starts_at>? ORDER BY n.created_at,n.id LIMIT 1`,
      )
      .get(now, now, now, new Date(now).toISOString());
    if (!row) return null;
    this.database
      .prepare(
        "UPDATE offer_notifications SET lease_until=?,lease_token=?,attempts=attempts+1 WHERE id=?",
      )
      .run(leaseUntil, leaseToken, String(row.id));
    return {
      id: String(row.id),
      offerId: String(row.offer_id),
      leaseToken,
      attempts: Number(row.attempts) + 1,
      to: String(row.email),
      name: String(row.name),
      matchId: String(row.match_id),
      title: String(row.title),
      timeZone: String(row.time_zone),
      expiresAt: Number(row.expires_at),
      createdAt: Number(row.created_at),
    };
  }
  markSent(id: string, leaseToken: string, now: number): void {
    this.database
      .prepare(
        "UPDATE offer_notifications SET sent_at=?,lease_until=NULL,lease_token=NULL WHERE id=? AND lease_token=?",
      )
      .run(now, id, leaseToken);
  }
  retry(id: string, leaseToken: string, nextAttemptAt: number): void {
    this.database
      .prepare(
        "UPDATE offer_notifications SET next_attempt_at=?,lease_until=NULL,lease_token=NULL WHERE id=? AND lease_token=?",
      )
      .run(nextAttemptAt, id, leaseToken);
  }
}
