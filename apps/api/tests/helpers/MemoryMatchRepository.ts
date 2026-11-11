import type { Match, MatchRecord } from "../../src/models/Match.ts";
import type { MatchRepository } from "../../src/repositories/interfaces/MatchRepository.ts";
import type { Person } from "../../src/models/Person.ts";

/** Adaptador de prueba sin dependencias de Express ni SQLite. */
export class MemoryMatchRepository implements MatchRepository {
  private readonly matches = new Map<string, Match>();

  constructor(private readonly people: Person[]) {}

  findById(id: string): Match | null {
    const match = this.matches.get(id);
    return match ? structuredClone(match) : null;
  }

  findForPerson(personId: string): Match[] {
    return [...this.matches.values()]
      .filter(
        (match) =>
          match.organizer.id === personId ||
          match.players.some((person) => person.id === personId),
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((match) => structuredClone(match));
  }

  insert(record: MatchRecord): void {
    const { organizerId, ...fields } = record;
    this.matches.set(record.id, {
      ...fields,
      organizer: this.person(organizerId),
      players: [],
    });
  }

  addParticipant(id: string, personId: string, _joinedAt: string): void {
    const match = this.matches.get(id);
    if (!match) throw new Error("Partido de prueba inexistente.");
    match.players.push(this.person(personId));
  }

  removeParticipant(id: string, personId: string): void {
    const match = this.matches.get(id);
    if (!match) throw new Error("Partido de prueba inexistente.");
    match.players = match.players.filter((person) => person.id !== personId);
  }

  private person(id: string): Person {
    const person = this.people.find((person) => person.id === id);
    if (!person) throw new Error("Persona de prueba inexistente.");
    return person;
  }
}
