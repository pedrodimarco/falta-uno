import type { Person } from "./Person.ts";
export type WaitlistStatus =
  | "waiting"
  | "offered"
  | "accepted"
  | "declined"
  | "expired"
  | "left"
  | "closed";
export interface WaitlistEntry {
  id: string;
  sequence: number;
  matchId: string;
  person: Person;
  status: WaitlistStatus;
  createdAt: number;
  offeredAt: number | null;
  expiresAt: number | null;
  resolvedAt: number | null;
}
export interface WaitlistView {
  reserved: number;
  waitingList: {
    person: Person;
    position: number;
    status: "waiting" | "offered";
    expiresAt: string | null;
  }[];
  waitlistPosition: number | null;
  waitlistState: WaitlistStatus | "none";
  offer: { id: string; expiresAt: string } | null;
}
