import type { Person, SessionPerson } from "../../models/Person.ts";
export interface SessionRecord {
  tokenHash: string;
  personId: string;
  expiresAt: number;
}

export interface SessionRepository {
  findPerson(tokenHash: string, now: number): SessionPerson | null;
  findAccount(email: string): Person | null;
  hasAccount(personId: string): boolean;
  insertPerson(person: Person): void;
  insertAccount(email: string, personId: string): void;
  insertSession(session: SessionRecord): void;
  revokeSession(tokenHash: string): void;
  revokePersonSessions(personId: string): void;
  mergeLegacyPerson(legacyId: string, accountId: string): void;
}
