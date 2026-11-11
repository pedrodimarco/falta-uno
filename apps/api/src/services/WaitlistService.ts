import { DomainError } from "../errors/DomainError.ts";
import type { Match } from "../models/Match.ts";
import type { WaitlistView } from "../models/WaitlistEntry.ts";
import type { MatchRepository } from "../repositories/interfaces/MatchRepository.ts";
import type { WaitlistRepository } from "../repositories/interfaces/WaitlistRepository.ts";
import type { OfferNotificationRepository } from "../repositories/interfaces/OfferNotificationRepository.ts";
import { assertParticipationOpen, isMatchClosed } from "../rules/matchRules.ts";
import { offerDeadline } from "../rules/waitlistRules.ts";
import type {
  Clock,
  IdGenerator,
  TransactionManager,
} from "./interfaces/dependencies.ts";
import type {
  WaitlistCoordinator,
  WaitlistUseCases,
} from "./interfaces/WaitlistUseCases.ts";
interface Dependencies {
  matches: MatchRepository;
  waitlist: WaitlistRepository;
  notifications: OfferNotificationRepository;
  transactions: TransactionManager;
  clock: Clock;
  generateId: IdGenerator;
}
export class WaitlistService implements WaitlistCoordinator, WaitlistUseCases {
  constructor(private readonly dependencies: Dependencies) {}
  private getMatch(id: string) {
    const match = this.dependencies.matches.findById(id);
    if (!match)
      throw new DomainError(
        "NOT_FOUND",
        "No encontramos ese partido. Revisá el enlace.",
      );
    return match;
  }
  reconcileInTransaction(match: Match, now: Date): void {
    const { waitlist, notifications } = this.dependencies;
    const entries = waitlist.findActive(match.id);
    for (const entry of entries) {
      if (isMatchClosed(match.startsAt, now))
        waitlist.resolve(entry.id, "closed", now.getTime());
      else if (match.players.some((person) => person.id === entry.person.id))
        waitlist.resolve(entry.id, "accepted", now.getTime());
      else if (
        entry.status === "offered" &&
        entry.expiresAt !== null &&
        entry.expiresAt <= now.getTime()
      )
        waitlist.resolve(entry.id, "expired", now.getTime());
    }
    if (isMatchClosed(match.startsAt, now)) return;
    const active = waitlist.findActive(match.id);
    let available =
      match.capacity -
      match.players.length -
      active.filter((entry) => entry.status === "offered").length;
    for (const entry of active) {
      if (available <= 0) break;
      if (entry.status !== "waiting") continue;
      waitlist.offer(
        entry.id,
        now.getTime(),
        offerDeadline(now, match.startsAt),
      );
      // La oferta y su aviso se confirman o revierten juntos.
      notifications.enqueue(entry.id, now.getTime());
      available--;
    }
  }
  view(match: Match, now: Date, viewerId?: string): WaitlistView {
    const { waitlist } = this.dependencies;
    const closed = isMatchClosed(match.startsAt, now);
    const active = closed
      ? []
      : waitlist
          .findActive(match.id)
          .filter(
            (entry) =>
              !match.players.some((person) => person.id === entry.person.id) &&
              (entry.status !== "offered" ||
                (entry.expiresAt !== null && entry.expiresAt > now.getTime())),
          );
    const latest = viewerId ? waitlist.findLatest(match.id, viewerId) : null;
    const own = active.find((entry) => entry.person.id === viewerId);
    let state: WaitlistView["waitlistState"] = latest?.status ?? "none";
    if (
      latest &&
      (latest.status === "waiting" || latest.status === "offered")
    ) {
      if (closed) state = "closed";
      else if (match.players.some((person) => person.id === viewerId))
        state = "accepted";
      else if (
        latest.status === "offered" &&
        latest.expiresAt !== null &&
        latest.expiresAt <= now.getTime()
      )
        state = "expired";
    }
    return {
      reserved: active.filter((entry) => entry.status === "offered").length,
      waitingList: active.map((entry, index) => ({
        person: entry.person,
        position: index + 1,
        status: entry.status as "waiting" | "offered",
        expiresAt:
          entry.expiresAt === null
            ? null
            : new Date(entry.expiresAt).toISOString(),
      })),
      waitlistPosition: own ? active.indexOf(own) + 1 : null,
      waitlistState: state,
      offer:
        own?.status === "offered" && own.expiresAt !== null
          ? { id: own.id, expiresAt: new Date(own.expiresAt).toISOString() }
          : null,
    };
  }
  join(matchId: string, personId: string): void {
    const { transactions, waitlist, clock, generateId } = this.dependencies;
    transactions.run(() => {
      const match = this.getMatch(matchId),
        now = clock.now();
      assertParticipationOpen(match, now, "join");
      this.reconcileInTransaction(match, now);
      if (match.players.some((person) => person.id === personId)) return;
      const active = waitlist.findActive(matchId);
      if (active.some((entry) => entry.person.id === personId)) return;
      const reserved = active.filter(
        (entry) => entry.status === "offered",
      ).length;
      if (match.players.length + reserved < match.capacity)
        throw new DomainError(
          "WAITLIST_NOT_NEEDED",
          "Hay cupos disponibles. Confirmá tu lugar directamente.",
        );
      waitlist.insert(generateId(), matchId, personId, now.getTime());
    });
  }
  leave(matchId: string, personId: string): void {
    const { transactions, waitlist, clock } = this.dependencies;
    transactions.run(() => {
      const match = this.getMatch(matchId),
        now = clock.now();
      this.reconcileInTransaction(match, now);
      const entry = waitlist
        .findActive(matchId)
        .find((entry) => entry.person.id === personId);
      if (entry) waitlist.resolve(entry.id, "left", now.getTime());
      this.reconcileInTransaction(match, now);
    });
  }
  private getOffer(matchId: string, offerId: string, personId: string) {
    const entry = this.dependencies.waitlist.findOffer(
      offerId,
      matchId,
      personId,
    );
    if (!entry)
      throw new DomainError(
        "NOT_FOUND",
        "No encontramos esa oferta para tu cuenta.",
      );
    return entry;
  }
  accept(matchId: string, offerId: string, personId: string): void {
    const { transactions, waitlist, matches, clock } = this.dependencies;
    transactions.run(() => {
      const match = this.getMatch(matchId),
        now = clock.now();
      this.reconcileInTransaction(match, now);
      const entry = this.getOffer(matchId, offerId, personId);
      if (entry.status === "accepted") return;
      assertParticipationOpen(match, now, "join");
      if (
        entry.status !== "offered" ||
        entry.expiresAt === null ||
        entry.expiresAt <= now.getTime()
      )
        throw new DomainError(
          "OFFER_UNAVAILABLE",
          "Esta oferta ya no está disponible. Revisá el estado del partido.",
        );
      if (!match.players.some((person) => person.id === personId)) {
        if (match.players.length >= match.capacity)
          throw new DomainError(
            "FULL",
            "Se completaron los cupos del partido.",
          );
        matches.addParticipant(matchId, personId, now.toISOString());
      }
      waitlist.resolve(entry.id, "accepted", now.getTime());
      this.reconcileInTransaction(this.getMatch(matchId), now);
    });
  }
  decline(matchId: string, offerId: string, personId: string): void {
    const { transactions, waitlist, clock } = this.dependencies;
    transactions.run(() => {
      const match = this.getMatch(matchId),
        now = clock.now();
      this.reconcileInTransaction(match, now);
      const entry = this.getOffer(matchId, offerId, personId);
      if (entry.status === "declined") return;
      assertParticipationOpen(match, now, "leave");
      if (entry.status !== "offered")
        throw new DomainError(
          "OFFER_UNAVAILABLE",
          "Esta oferta ya no está disponible.",
        );
      waitlist.resolve(entry.id, "declined", now.getTime());
      this.reconcileInTransaction(match, now);
    });
  }
  processPending(): void {
    for (const id of this.dependencies.waitlist.findMatchesToProcess()) {
      this.dependencies.transactions.run(() =>
        this.reconcileInTransaction(
          this.getMatch(id),
          this.dependencies.clock.now(),
        ),
      );
    }
  }
}
