import type { MatchRecord } from "../../models/Match.ts";
export type UpdateMatchCommand = Omit<
  MatchRecord,
  "id" | "organizerId" | "version"
> & { expectedVersion: number };
export type AddPlayerCommand =
  | { kind: "registered"; email: string }
  | { kind: "guest"; name: string; guestId: string };
export interface MatchManagementUseCases {
  update(id: string, input: UpdateMatchCommand, organizerId: string): void;
  addPlayer(id: string, input: AddPlayerCommand, organizerId: string): void;
  removePlayer(id: string, playerId: string, organizerId: string): void;
}
