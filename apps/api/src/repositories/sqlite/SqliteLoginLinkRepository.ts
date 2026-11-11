import type { DatabaseSync } from "node:sqlite";
import type { LoginLink } from "../../models/LoginLink.ts";
import type { LoginLinkRepository } from "../interfaces/LoginLinkRepository.ts";

export class SqliteLoginLinkRepository implements LoginLinkRepository {
  constructor(private readonly database: DatabaseSync) {}
  insert(link: LoginLink): void {
    this.database
      .prepare(
        `INSERT INTO login_links
      (token_hash,flow_hash,email,name,return_to,created_at,expires_at,consumed_at,legacy_person_id,legacy_session_hash)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        link.tokenHash,
        link.flowHash,
        link.email,
        link.name,
        link.returnTo,
        link.createdAt,
        link.expiresAt,
        link.consumedAt,
        link.legacyPersonId,
        link.legacySessionHash,
      );
  }
  find(hash: string): LoginLink | null {
    const row = this.database
      .prepare("SELECT * FROM login_links WHERE token_hash=?")
      .get(hash);
    if (!row) return null;
    return {
      tokenHash: String(row.token_hash),
      flowHash: String(row.flow_hash),
      email: String(row.email),
      name: String(row.name),
      returnTo: String(row.return_to),
      createdAt: Number(row.created_at),
      expiresAt: Number(row.expires_at),
      consumedAt: row.consumed_at === null ? null : Number(row.consumed_at),
      legacyPersonId:
        row.legacy_person_id === null ? null : String(row.legacy_person_id),
      legacySessionHash:
        row.legacy_session_hash === null
          ? null
          : String(row.legacy_session_hash),
    };
  }
  consume(hash: string, now: number): boolean {
    return (
      this.database
        .prepare(
          "UPDATE login_links SET consumed_at=? WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?",
        )
        .run(now, hash, now).changes === 1
    );
  }
  remove(hash: string): void {
    this.database
      .prepare("DELETE FROM login_links WHERE token_hash=?")
      .run(hash);
  }
  countForEmail(hash: string, since: number): number {
    return Number(
      this.database
        .prepare(
          "SELECT count(*) AS count FROM auth_requests WHERE email_hash=? AND created_at>?",
        )
        .get(hash, since)?.count,
    );
  }
  countForIp(hash: string, since: number): number {
    return Number(
      this.database
        .prepare(
          "SELECT count(*) AS count FROM auth_requests WHERE ip_hash=? AND created_at>?",
        )
        .get(hash, since)?.count,
    );
  }
  recordRequest(emailHash: string, ipHash: string, now: number): void {
    this.database
      .prepare("INSERT INTO auth_requests VALUES (?,?,?)")
      .run(emailHash, ipHash, now);
  }
  cleanup(now: number): void {
    this.database
      .prepare("DELETE FROM auth_requests WHERE created_at<?")
      .run(now - 3_600_000);
    this.database
      .prepare("DELETE FROM login_links WHERE expires_at<?")
      .run(now - 86_400_000);
  }
}
