import type { Match, MatchRecord } from "../../models/Match.ts";

export interface MatchRepository {
  findById(id: string): Match | null;
  findForPerson(personId: string): Match[];
  insert(match: MatchRecord): void;
  addParticipant(matchId: string, personId: string, joinedAt: string): void;
  removeParticipant(matchId: string, personId: string): void;
}
