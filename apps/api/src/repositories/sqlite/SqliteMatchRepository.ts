import type { DatabaseSync, SQLOutputValue } from "node:sqlite";
import type { Match, MatchRecord } from "../../models/Match.ts";
import type { MatchRepository } from "../interfaces/MatchRepository.ts";
import { mapMatchRecord, mapPerson } from "./rowMappers.ts";

const SELECT_MATCH = `
  SELECT m.*, p.name AS organizer_name
  FROM matches m JOIN people p ON p.id = m.organizer_id
`;

export class SqliteMatchRepository implements MatchRepository {
  constructor(private readonly database: DatabaseSync) {}

  private toMatch(row: Record<string, SQLOutputValue>): Match {
    const { organizerId, ...record } = mapMatchRecord(row);
    const players = this.database
      .prepare(
        `
      SELECT p.id, p.name FROM participants t
      JOIN people p ON p.id = t.person_id
      WHERE t.match_id = ? ORDER BY t.joined_at, p.id
    `,
      )
      .all(record.id)
      .map(mapPerson);
    return {
      ...record,
      organizer: { id: organizerId, name: String(row.organizer_name) },
      players,
    };
  }

  findById(id: string): Match | null {
    const row = this.database.prepare(`${SELECT_MATCH} WHERE m.id = ?`).get(id);
    return row ? this.toMatch(row) : null;
  }

  findForPerson(personId: string): Match[] {
    return this.database
      .prepare(
        `
      ${SELECT_MATCH}
      WHERE m.organizer_id = ? OR EXISTS (
        SELECT 1 FROM participants t WHERE t.match_id = m.id AND t.person_id = ?
      ) OR EXISTS (SELECT 1 FROM waitlist_entries w WHERE w.match_id=m.id AND w.person_id=? AND w.status IN ('waiting','offered'))
      ORDER BY m.starts_at
    `,
      )
      .all(personId, personId, personId)
      .map((row) => this.toMatch(row));
  }

  insert(match: MatchRecord): void {
    this.database
      .prepare(
        `
      INSERT INTO matches (
        id, sport, title, starts_at, time_zone, venue,
        capacity, price, currency, notes, organizer_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        match.id,
        match.sport,
        match.title,
        match.startsAt,
        match.timeZone,
        match.venue,
        match.capacity,
        match.price,
        match.currency,
        match.notes,
        match.organizerId,
      );
  }

  addParticipant(matchId: string, personId: string, joinedAt: string): void {
    this.database
      .prepare(
        `
      INSERT INTO participants (match_id, person_id, joined_at) VALUES (?, ?, ?)
    `,
      )
      .run(matchId, personId, joinedAt);
  }

  removeParticipant(matchId: string, personId: string): void {
    this.database
      .prepare("DELETE FROM participants WHERE match_id = ? AND person_id = ?")
      .run(matchId, personId);
  }
}
