import type { Person } from "../../models/Person.ts";
export interface PlayerRepository {
  findByEmail(email: string): Person | null;
  findById(id: string): { person: Person; guestMatchId: string | null } | null;
  insertGuest(person: Person, matchId: string): void;
}
