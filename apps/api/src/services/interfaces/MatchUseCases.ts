import type { Match, MatchRecord } from "../../models/Match.ts";
import type { WaitlistView } from "../../models/WaitlistEntry.ts";
import type { Person } from "../../models/Person.ts";

export type CreateMatchCommand = Omit<MatchRecord, "id" | "organizerId"> & {
  organizerPlays: boolean;
};

export interface MatchSummaryView extends Omit<
  MatchRecord,
  "notes" | "organizerId"
> {
  confirmed: number;
  reserved: number;
}

export interface MatchDetailView extends MatchSummaryView, WaitlistView {
  notes: string;
  organizer: Match["organizer"];
  players: Match["players"];
  joined: boolean;
  isOrganizer: boolean;
  closed: boolean;
}

/** Contrato que consumen los adaptadores de entrada, por ejemplo HTTP. */
export interface MatchUseCases {
  list(personId: string): MatchSummaryView[];
  detail(id: string, viewerId?: string): MatchDetailView;
  create(input: CreateMatchCommand, organizer: Person): MatchDetailView;
  join(id: string, personId: string): MatchDetailView;
  leave(id: string, personId: string): MatchDetailView;
}
