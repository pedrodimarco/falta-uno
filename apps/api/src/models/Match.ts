import type { Person } from "./Person.ts";

export type Sport = "Fútbol 5" | "Pádel" | "Básquet" | "Otro";

export interface MatchRecord {
  id: string;
  sport: Sport;
  title: string;
  startsAt: string;
  timeZone: string;
  venue: string;
  capacity: number;
  price: number | null;
  currency: "UYU";
  notes: string;
  organizerId: string;
}

export interface Match extends Omit<MatchRecord, "organizerId"> {
  organizer: Person;
  players: Person[];
}
