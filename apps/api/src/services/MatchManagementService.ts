import type { Person } from "../models/Person.ts";
import type { MatchRepository } from "../repositories/interfaces/MatchRepository.ts";
import type { PlayerRepository } from "../repositories/interfaces/PlayerRepository.ts";
import type { Clock, TransactionManager } from "./interfaces/dependencies.ts";
import type { WaitlistCoordinator } from "./interfaces/WaitlistUseCases.ts";
import type {
  MatchManagementUseCases,
  UpdateMatchCommand,
  AddPlayerCommand,
} from "./interfaces/MatchManagementUseCases.ts";
import {
  assertOrganizer,
  assertParticipationOpen,
  assertFutureStart,
  assertAvailableCapacity,
} from "../rules/matchRules.ts";
import { DomainError } from "../errors/DomainError.ts";

interface Dependencies {
  matches: MatchRepository;
  players: PlayerRepository;
  waitlist: WaitlistCoordinator;
  transactions: TransactionManager;
  clock: Clock;
}

export class MatchManagementService implements MatchManagementUseCases {
  constructor(private readonly dependencies: Dependencies) {}
  private managedMatch(id: string, organizerId: string, now: Date) {
    const match = this.dependencies.matches.findById(id);
    if (!match)
      throw new DomainError("NOT_FOUND", "No encontramos ese partido.");
    assertOrganizer(match, organizerId);
    assertParticipationOpen(match, now, "join");
    return match;
  }
  update(id: string, input: UpdateMatchCommand, organizerId: string): void {
    const { matches, waitlist, transactions, clock } = this.dependencies;
    transactions.run(() => {
      const now = clock.now();
      const match = this.managedMatch(id, organizerId, now);
      if (input.expectedVersion !== match.version)
        throw new DomainError(
          "STALE_MATCH",
          "El partido fue editado desde otra pantalla. Actualizá los datos antes de volver a guardar.",
        );
      assertFutureStart(input.startsAt, now);
      waitlist.reconcileInTransaction(match, now);
      const { reserved } = waitlist.view(match, now);
      if (input.capacity < match.players.length + reserved)
        throw new DomainError(
          "CAPACITY_TOO_SMALL",
          "Los cupos no pueden ser menores que los jugadores confirmados y las reservas vigentes.",
        );
      const { expectedVersion: _, ...fields } = input;
      matches.update(id, {
        ...fields,
        startsAt: new Date(fields.startsAt).toISOString(),
        version: match.version + 1,
      });
      waitlist.adjustStartInTransaction(id, fields.startsAt);
      waitlist.reconcileInTransaction(matches.findById(id)!, now);
    });
  }
  addPlayer(id: string, input: AddPlayerCommand, organizerId: string): void {
    const { matches, players, waitlist, transactions, clock } =
      this.dependencies;
    transactions.run(() => {
      const now = clock.now();
      const match = this.managedMatch(id, organizerId, now);
      let person: Person;
      if (input.kind === "registered") {
        const registered = players.findByEmail(input.email);
        if (!registered)
          throw new DomainError(
            "PLAYER_NOT_FOUND",
            "No encontramos una cuenta verificada con ese correo. Podés agregar a la persona como invitada.",
          );
        person = registered;
      } else {
        const existing = players.findById(input.guestId);
        if (
          existing &&
          (existing.guestMatchId !== id || existing.person.name !== input.name)
        )
          throw new DomainError(
            "PLAYER_CONFLICT",
            "El identificador del invitado ya se utilizó. Volvé a cargar sus datos.",
          );
        person = existing?.person ?? {
          id: input.guestId,
          name: input.name,
          isGuest: true,
        };
      }
      waitlist.reconcileInTransaction(match, now);
      if (match.players.some((player) => player.id === person.id)) return;
      const state = waitlist.view(match, now, person.id);
      // Puede confirmar una oferta ya asignada, pero nunca saltar la espera.
      assertAvailableCapacity(match, state.reserved - (state.offer ? 1 : 0));
      if (input.kind === "guest" && !players.findById(person.id))
        players.insertGuest(person, id);
      matches.addParticipant(id, person.id, now.toISOString());
      waitlist.reconcileInTransaction(matches.findById(id)!, now);
    });
  }
  removePlayer(id: string, personId: string, organizerId: string): void {
    const { matches, waitlist, transactions, clock } = this.dependencies;
    transactions.run(() => {
      const now = clock.now();
      const match = this.managedMatch(id, organizerId, now);
      waitlist.reconcileInTransaction(match, now);
      waitlist.removePersonInTransaction(id, personId, now);
      matches.removeParticipant(id, personId);
      waitlist.reconcileInTransaction(matches.findById(id)!, now);
    });
  }
}
