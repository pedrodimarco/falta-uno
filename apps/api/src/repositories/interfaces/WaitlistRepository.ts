import type {
  WaitlistEntry,
  WaitlistStatus,
} from "../../models/WaitlistEntry.ts";
export interface WaitlistRepository {
  findActive(matchId: string): WaitlistEntry[];
  findLatest(matchId: string, personId: string): WaitlistEntry | null;
  findOffer(
    id: string,
    matchId: string,
    personId: string,
  ): WaitlistEntry | null;
  findMatchesToProcess(): string[];
  insert(id: string, matchId: string, personId: string, now: number): void;
  offer(id: string, now: number, expiresAt: number): void;
  resolve(
    id: string,
    status: Exclude<WaitlistStatus, "waiting" | "offered">,
    now: number,
  ): void;
}
