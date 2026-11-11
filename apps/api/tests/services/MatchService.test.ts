import { test } from "node:test";
import assert from "node:assert/strict";
import { MatchService } from "../../src/services/MatchService.ts";
import type { CreateMatchCommand } from "../../src/services/interfaces/MatchUseCases.ts";
import type { TransactionManager } from "../../src/services/interfaces/dependencies.ts";
import { DomainError } from "../../src/errors/DomainError.ts";
import { MemoryMatchRepository } from "../helpers/MemoryMatchRepository.ts";

const organizer = { id: "organizer", name: "Pedro" };
const guest = { id: "guest", name: "Martín" };
const other = { id: "other", name: "Diego" };
const start = "2030-01-02T20:00:00.000Z";
const input: CreateMatchCommand = {
  sport: "Fútbol 5",
  title: "Partido de prueba",
  startsAt: start,
  timeZone: "America/Montevideo",
  venue: "Cancha Centro",
  capacity: 2,
  price: 25000,
  currency: "UYU",
  notes: "",
  organizerPlays: true,
};

function fixture() {
  let now = new Date("2030-01-01T00:00:00.000Z");
  let transactionActive = false;
  let transactionCount = 0;
  let sequence = 0;
  let requireTransactionalReads = false;
  class TransactionAwareRepository extends MemoryMatchRepository {
    override addParticipant(id: string, personId: string, joinedAt: string) {
      assert.equal(
        transactionActive,
        true,
        "Las altas deben realizarse dentro de la transacción.",
      );
      super.addParticipant(id, personId, joinedAt);
    }
    override removeParticipant(id: string, personId: string) {
      assert.equal(transactionActive, true);
      super.removeParticipant(id, personId);
    }
    override findById(id: string) {
      if (requireTransactionalReads)
        assert.equal(
          transactionActive,
          true,
          "El chequeo de cupos debe estar dentro de la transacción.",
        );
      return super.findById(id);
    }
  }
  const repository = new TransactionAwareRepository([organizer, guest, other]);
  const transactions: TransactionManager = {
    run(operation) {
      transactionActive = true;
      transactionCount++;
      try {
        return operation();
      } finally {
        transactionActive = false;
      }
    },
  };
  const service = new MatchService({
    matches: repository,
    waitlist: {
      reconcileInTransaction: () => {},
      view: () => ({
        reserved: 0,
        waitingList: [],
        waitlistPosition: null,
        waitlistState: "none",
        offer: null,
      }),
    },
    transactions,
    clock: { now: () => now },
    generateId: () => `match-${++sequence}`,
  });
  return {
    service,
    requireTransactionalReads: () => {
      requireTransactionalReads = true;
    },
    advanceTo: (date: string) => {
      now = new Date(date);
    },
    transactionCount: () => transactionCount,
  };
}

const hasCode = (code: string) => (error: unknown) =>
  error instanceof DomainError && error.code === code;

test("servicio independiente: crear y consultar produce las vistas esperadas", () => {
  const f = fixture();
  const match = f.service.create(input, organizer);
  assert.equal(match.confirmed, 1);
  assert.equal(match.joined, true);
  assert.equal(match.isOrganizer, true);
  assert.equal(f.service.detail(match.id).joined, false);
  assert.equal(f.service.list(organizer.id).length, 1);
  assert.equal(f.service.list(guest.id).length, 0);
  assert.equal(f.transactionCount(), 1);
});

test("el negocio evita sobrecupos y las confirmaciones repetidas son idempotentes", () => {
  const f = fixture();
  const match = f.service.create(input, organizer);
  f.requireTransactionalReads();
  assert.equal(f.service.join(match.id, guest.id).confirmed, 2);
  assert.equal(f.service.join(match.id, guest.id).confirmed, 2);
  assert.throws(() => f.service.join(match.id, other.id), hasCode("FULL"));
  assert.equal(f.service.leave(match.id, guest.id).confirmed, 1);
  assert.equal(f.service.leave(match.id, guest.id).confirmed, 1);
  assert.equal(f.service.join(match.id, other.id).confirmed, 2);
  assert.equal(f.transactionCount(), 7);
});

test("las reglas usan el reloj inyectado y cierran altas y bajas al comenzar", () => {
  const f = fixture();
  const match = f.service.create(input, organizer);
  f.advanceTo(start);
  assert.equal(f.service.detail(match.id).closed, true);
  assert.throws(() => f.service.join(match.id, guest.id), hasCode("CLOSED"));
  assert.throws(
    () => f.service.leave(match.id, organizer.id),
    hasCode("CLOSED"),
  );
  assert.throws(() => f.service.create(input, organizer), hasCode("PAST_DATE"));
});

test("un organizador puede crear sin jugar; un partido desconocido es un error de negocio", () => {
  const f = fixture();
  const match = f.service.create(
    { ...input, organizerPlays: false },
    organizer,
  );
  assert.equal(match.confirmed, 0);
  assert.equal(match.joined, false);
  assert.equal(match.isOrganizer, true);
  assert.throws(() => f.service.detail("missing"), hasCode("NOT_FOUND"));
});
