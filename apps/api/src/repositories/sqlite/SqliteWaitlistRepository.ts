import type { DatabaseSync, SQLOutputValue } from "node:sqlite";
import type {
  WaitlistEntry,
  WaitlistStatus,
} from "../../models/WaitlistEntry.ts";
import type { WaitlistRepository } from "../interfaces/WaitlistRepository.ts";
const SELECT_ENTRY =
  "SELECT w.*,p.name FROM waitlist_entries w JOIN people p ON p.id=w.person_id";
function mapEntry(row: Record<string, SQLOutputValue>): WaitlistEntry {
  return {
    id: String(row.id),
    sequence: Number(row.sequence),
    matchId: String(row.match_id),
    person: { id: String(row.person_id), name: String(row.name) },
    status: row.status as WaitlistStatus,
    createdAt: Number(row.created_at),
    offeredAt: row.offered_at === null ? null : Number(row.offered_at),
    expiresAt: row.expires_at === null ? null : Number(row.expires_at),
    resolvedAt: row.resolved_at === null ? null : Number(row.resolved_at),
  };
}
export class SqliteWaitlistRepository implements WaitlistRepository {
  constructor(private readonly database: DatabaseSync) {}
  findActive(id: string): WaitlistEntry[] {
    return this.database
      .prepare(
        `${SELECT_ENTRY} WHERE w.match_id=? AND w.status IN ('waiting','offered') ORDER BY w.sequence`,
      )
      .all(id)
      .map(mapEntry);
  }
  findLatest(id: string, personId: string): WaitlistEntry | null {
    const row = this.database
      .prepare(
        `${SELECT_ENTRY} WHERE w.match_id=? AND w.person_id=? ORDER BY w.sequence DESC LIMIT 1`,
      )
      .get(id, personId);
    return row ? mapEntry(row) : null;
  }
  findOffer(
    id: string,
    matchId: string,
    personId: string,
  ): WaitlistEntry | null {
    const row = this.database
      .prepare(
        `${SELECT_ENTRY} WHERE w.id=? AND w.match_id=? AND w.person_id=?`,
      )
      .get(id, matchId, personId);
    return row ? mapEntry(row) : null;
  }
  findMatchesToProcess(): string[] {
    return this.database
      .prepare(
        "SELECT DISTINCT match_id FROM waitlist_entries WHERE status IN ('waiting','offered') ORDER BY match_id",
      )
      .all()
      .map((row) => String(row.match_id));
  }
  insert(id: string, matchId: string, personId: string, now: number): void {
    this.database
      .prepare(
        "INSERT INTO waitlist_entries (id,match_id,person_id,status,created_at) VALUES (?,?,?,'waiting',?)",
      )
      .run(id, matchId, personId, now);
  }
  offer(id: string, now: number, expiresAt: number): void {
    this.database
      .prepare(
        "UPDATE waitlist_entries SET status='offered',offered_at=?,expires_at=? WHERE id=? AND status='waiting'",
      )
      .run(now, expiresAt, id);
  }
  resolve(
    id: string,
    status: Exclude<WaitlistStatus, "waiting" | "offered">,
    now: number,
  ): void {
    this.database
      .prepare(
        "UPDATE waitlist_entries SET status=?,resolved_at=? WHERE id=? AND status IN ('waiting','offered')",
      )
      .run(status, now, id);
  }
}
