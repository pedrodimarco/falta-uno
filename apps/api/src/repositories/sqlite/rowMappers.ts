import type { SQLOutputValue } from "node:sqlite";
import type { MatchRecord, Sport } from "../../models/Match.ts";
import type { Person } from "../../models/Person.ts";

type Row = Record<string, SQLOutputValue>;

export function mapPerson(row: Row): Person {
  return { id: String(row.id), name: String(row.name) };
}

export function mapMatchRecord(row: Row): MatchRecord {
  return {
    id: String(row.id),
    sport: row.sport as Sport,
    title: String(row.title),
    startsAt: String(row.starts_at),
    timeZone: String(row.time_zone),
    venue: String(row.venue),
    capacity: Number(row.capacity),
    price: row.price === null ? null : Number(row.price),
    currency: row.currency as "UYU",
    notes: String(row.notes),
    organizerId: String(row.organizer_id),
  };
}
