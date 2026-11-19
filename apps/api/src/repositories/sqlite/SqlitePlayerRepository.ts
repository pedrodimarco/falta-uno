import type { DatabaseSync } from "node:sqlite";
import type { Person } from "../../models/Person.ts";
import type { PlayerRepository } from "../interfaces/PlayerRepository.ts";
import { mapPerson } from "./rowMappers.ts";
export class SqlitePlayerRepository implements PlayerRepository {
  constructor(private readonly database: DatabaseSync) {}
  findByEmail(email: string) {
    const row = this.database
      .prepare(
        "SELECT p.id,p.name FROM people p JOIN email_accounts a ON a.person_id=p.id WHERE a.email=?",
      )
      .get(email);
    return row ? mapPerson(row) : null;
  }
  findById(id: string) {
    const row = this.database
      .prepare(
        "SELECT p.id,p.name,g.match_id FROM people p LEFT JOIN guest_players g ON g.person_id=p.id WHERE p.id=?",
      )
      .get(id);
    return row
      ? {
          person: mapPerson(row),
          guestMatchId: row.match_id === null ? null : String(row.match_id),
        }
      : null;
  }
  insertGuest(person: Person, matchId: string) {
    this.database
      .prepare("INSERT INTO people(id,name) VALUES (?,?)")
      .run(person.id, person.name);
    this.database
      .prepare("INSERT INTO guest_players(person_id,match_id) VALUES (?,?)")
      .run(person.id, matchId);
  }
}
