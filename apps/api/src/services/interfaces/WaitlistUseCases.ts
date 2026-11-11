import type { Match } from "../../models/Match.ts";
import type { WaitlistView } from "../../models/WaitlistEntry.ts";
export interface WaitlistCoordinator {
  /** El llamador debe mantener abierta la transacción de modificación del partido. */
  reconcileInTransaction(match: Match, now: Date): void;
  view(match: Match, now: Date, viewerId?: string): WaitlistView;
}
export interface WaitlistUseCases {
  join(matchId: string, personId: string): void;
  leave(matchId: string, personId: string): void;
  accept(matchId: string, offerId: string, personId: string): void;
  decline(matchId: string, offerId: string, personId: string): void;
  processPending(): void;
}
