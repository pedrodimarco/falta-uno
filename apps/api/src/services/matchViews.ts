import type { WaitlistView } from "../models/WaitlistEntry.ts";
import type { Match } from "../models/Match.ts";
import { isMatchClosed } from "../rules/matchRules.ts";
import type {
  MatchDetailView,
  MatchSummaryView,
} from "./interfaces/MatchUseCases.ts";

export function toMatchSummary(match: Match): MatchSummaryView {
  return {
    id: match.id,
    sport: match.sport,
    title: match.title,
    startsAt: match.startsAt,
    timeZone: match.timeZone,
    venue: match.venue,
    capacity: match.capacity,
    confirmed: match.players.length,
    reserved: 0,
    price: match.price,
    currency: match.currency,
  };
}

export function toMatchDetail(
  match: Match,
  now: Date,
  viewerId?: string,
  waitlist: WaitlistView = {
    reserved: 0,
    waitingList: [],
    waitlistPosition: null,
    waitlistState: "none",
    offer: null,
  },
): MatchDetailView {
  return {
    ...toMatchSummary(match),
    ...waitlist,
    notes: match.notes,
    organizer: match.organizer,
    players: match.players,
    joined: match.players.some((person) => person.id === viewerId),
    isOrganizer: match.organizer.id === viewerId,
    closed: isMatchClosed(match.startsAt, now),
  };
}
