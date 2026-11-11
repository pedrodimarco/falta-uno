import type { DatabaseSync } from "node:sqlite";
import type { Person, SessionPerson } from "../../models/Person.ts";
import type {
  SessionRecord,
  SessionRepository,
} from "../interfaces/SessionRepository.ts";
import { mapPerson } from "./rowMappers.ts";

export class SqliteSessionRepository implements SessionRepository {
  constructor(private readonly database: DatabaseSync) {}
  findPerson(hash: string, now: number): SessionPerson | null {
    const row = this.database
      .prepare(
        `SELECT p.id,p.name,a.email FROM sessions s
      JOIN people p ON p.id=s.person_id LEFT JOIN email_accounts a ON a.person_id=p.id
      WHERE s.token_hash=? AND s.expires_at>?`,
      )
      .get(hash, now);
    return row
      ? {
          ...mapPerson(row),
          email: typeof row.email === "string" ? row.email : null,
        }
      : null;
  }
  findAccount(email: string): Person | null {
    const row = this.database
      .prepare(
        "SELECT p.id,p.name FROM email_accounts a JOIN people p ON p.id=a.person_id WHERE a.email=?",
      )
      .get(email);
    return row ? mapPerson(row) : null;
  }
  hasAccount(id: string): boolean {
    return Boolean(
      this.database
        .prepare("SELECT 1 FROM email_accounts WHERE person_id=?")
        .get(id),
    );
  }
  insertPerson(person: Person): void {
    this.database
      .prepare("INSERT INTO people (id,name) VALUES (?,?)")
      .run(person.id, person.name);
  }
  insertAccount(email: string, personId: string): void {
    this.database
      .prepare("INSERT INTO email_accounts VALUES (?,?)")
      .run(email, personId);
  }
  insertSession(session: SessionRecord): void {
    this.database
      .prepare("INSERT INTO sessions VALUES (?,?,?)")
      .run(session.tokenHash, session.personId, session.expiresAt);
  }
  revokeSession(hash: string): void {
    this.database.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash);
  }
  revokePersonSessions(id: string): void {
    this.database.prepare("DELETE FROM sessions WHERE person_id=?").run(id);
  }
  mergeLegacyPerson(legacyId: string, accountId: string): void {
    this.database
      .prepare("UPDATE matches SET organizer_id=? WHERE organizer_id=?")
      .run(accountId, legacyId);
    this.database
      .prepare(
        `INSERT OR IGNORE INTO participants (match_id,person_id,joined_at)
      SELECT match_id,?,joined_at FROM participants WHERE person_id=?`,
      )
      .run(accountId, legacyId);
    this.database
      .prepare("DELETE FROM participants WHERE person_id=?")
      .run(legacyId);
    this.revokePersonSessions(legacyId);
  }
}
