import type { WaitlistCoordinator } from "./interfaces/WaitlistUseCases.ts";
import { DomainError } from "../errors/DomainError.ts";
import type { MatchRepository } from "../repositories/interfaces/MatchRepository.ts";
import {
  assertAvailableCapacity,
  assertFutureStart,
  assertParticipationOpen,
} from "../rules/matchRules.ts";
import type { Person } from "../models/Person.ts";
import type {
  Clock,
  IdGenerator,
  TransactionManager,
} from "./interfaces/dependencies.ts";
import type {
  CreateMatchCommand,
  MatchUseCases,
} from "./interfaces/MatchUseCases.ts";
import { toMatchDetail, toMatchSummary } from "./matchViews.ts";

interface MatchServiceDependencies {
  matches: MatchRepository;
  waitlist: WaitlistCoordinator;
  transactions: TransactionManager;
  clock: Clock;
  generateId: IdGenerator;
}

export class MatchService implements MatchUseCases {
  constructor(private readonly dependencies: MatchServiceDependencies) {}

  private getMatch(id: string) {
    const match = this.dependencies.matches.findById(id);
    if (!match) {
      throw new DomainError(
        "NOT_FOUND",
        "No encontramos ese partido. Revisá el enlace.",
      );
    }
    return match;
  }

  list(personId: string) {
    return this.dependencies.matches.findForPerson(personId).map((match) => ({
      ...toMatchSummary(match),
      reserved: this.dependencies.waitlist.view(
        match,
        this.dependencies.clock.now(),
      ).reserved,
    }));
  }

  detail(id: string, viewerId?: string) {
    const match = this.getMatch(id),
      now = this.dependencies.clock.now();
    return toMatchDetail(
      match,
      now,
      viewerId,
      this.dependencies.waitlist.view(match, now, viewerId),
    );
  }

  create(input: CreateMatchCommand, organizer: Person) {
    const { matches, transactions, clock, generateId } = this.dependencies;
    const now = clock.now();
    assertFutureStart(input.startsAt, now);
    const id = generateId();

    return transactions.run(() => {
      const { organizerPlays, ...fields } = input;
      matches.insert({
        ...fields,
        id,
        organizerId: organizer.id,
        startsAt: new Date(input.startsAt).toISOString(),
      });
      if (organizerPlays)
        matches.addParticipant(id, organizer.id, now.toISOString());
      return this.detail(id, organizer.id);
    });
  }

  join(id: string, personId: string) {
    const { matches, transactions, clock } = this.dependencies;
    return transactions.run(() => {
      // Leer, verificar y ocupar el cupo pertenecen a la misma transacción.
      const match = this.getMatch(id);
      const now = clock.now();
      assertParticipationOpen(match, now, "join");
      this.dependencies.waitlist.reconcileInTransaction(match, now);
      if (!match.players.some((person) => person.id === personId)) {
        const state = this.dependencies.waitlist.view(match, now, personId);
        if (state.offer)
          throw new DomainError(
            "OFFER_REQUIRED",
            "Tenés un lugar reservado. Aceptá la oferta para confirmarlo.",
          );
        assertAvailableCapacity(match, state.reserved);
        matches.addParticipant(id, personId, now.toISOString());
      }
      return this.detail(id, personId);
    });
  }

  leave(id: string, personId: string) {
    const { matches, transactions, clock } = this.dependencies;
    return transactions.run(() => {
      const match = this.getMatch(id);
      const now = clock.now();
      assertParticipationOpen(match, now, "leave");
      this.dependencies.waitlist.reconcileInTransaction(match, now);
      matches.removeParticipant(id, personId);
      this.dependencies.waitlist.reconcileInTransaction(
        this.getMatch(id),
        clock.now(),
      );
      return this.detail(id, personId);
    });
  }
}
