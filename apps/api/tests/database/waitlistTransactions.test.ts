import { MatchManagementService } from "../../src/services/MatchManagementService.ts";
import { SqlitePlayerRepository } from "../../src/repositories/sqlite/SqlitePlayerRepository.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../src/database/connection.ts";
import { SqliteTransactionManager } from "../../src/database/SqliteTransactionManager.ts";
import { SqliteMatchRepository } from "../../src/repositories/sqlite/SqliteMatchRepository.ts";
import { SqliteSessionRepository } from "../../src/repositories/sqlite/SqliteSessionRepository.ts";
import { SqliteWaitlistRepository } from "../../src/repositories/sqlite/SqliteWaitlistRepository.ts";
import { SqliteOfferNotificationRepository } from "../../src/repositories/sqlite/SqliteOfferNotificationRepository.ts";
import { WaitlistService } from "../../src/services/WaitlistService.ts";
import { MatchService } from "../../src/services/MatchService.ts";

function fixture() {
  const database = openDatabase(":memory:");
  const transactions = new SqliteTransactionManager(database);
  const sessions = new SqliteSessionRepository(database),
    matches = new SqliteMatchRepository(database),
    entries = new SqliteWaitlistRepository(database),
    notifications = new SqliteOfferNotificationRepository(database);
  const now = new Date("2030-01-01T00:00:00.000Z");
  for (const id of ["organizer", "player", "waiter"]) {
    sessions.insertPerson({ id, name: id });
    sessions.insertAccount(`${id}@example.test`, id);
  }
  matches.insert({
    id: "match",
    version: 1,
    organizerId: "organizer",
    sport: "Pádel",
    title: "Partido",
    startsAt: "2030-01-02T00:00:00.000Z",
    timeZone: "America/Montevideo",
    venue: "Cancha",
    capacity: 2,
    price: null,
    currency: "UYU",
    notes: "",
  });
  matches.addParticipant("match", "organizer", now.toISOString());
  matches.addParticipant("match", "player", now.toISOString());
  entries.insert("offer", "match", "waiter", now.getTime());
  const waitlist = new WaitlistService({
    matches,
    waitlist: entries,
    notifications,
    transactions,
    clock: { now: () => now },
    generateId: () => "id",
  });
  const service = new MatchService({
    matches,
    waitlist,
    transactions,
    clock: { now: () => now },
    generateId: () => "id",
  });
  return {
    database,
    transactions,
    matches,
    entries,
    notifications,
    waitlist,
    service,
    now,
  };
}
test("si falla registrar el aviso, se revierten juntos baja, oferta y reserva", () => {
  const f = fixture();
  try {
    const enqueue = f.notifications.enqueue.bind(f.notifications);
    f.notifications.enqueue = () => {
      throw new Error("fallo de persistencia del aviso");
    };
    assert.throws(
      () => f.service.leave("match", "player"),
      /fallo de persistencia/,
    );
    assert.equal(f.matches.findById("match")?.players.length, 2);
    assert.equal(f.entries.findActive("match")[0].status, "waiting");
    f.notifications.enqueue = enqueue;
    const result = f.service.leave("match", "player");
    assert.equal(result.confirmed, 1);
    assert.equal(result.reserved, 1);
  } finally {
    f.database.close();
  }
});

test("los avisos tienen lease persistente y no pueden marcarlos como enviados otros workers", () => {
  const f = fixture();
  try {
    f.service.leave("match", "player");
    const now = f.now.getTime();
    const first = f.transactions.run(() =>
      f.notifications.claimNext(now, now + 60000, "worker-a"),
    );
    assert.ok(first);
    assert.equal(
      f.transactions.run(() =>
        f.notifications.claimNext(now, now + 60000, "worker-b"),
      ),
      null,
    );
    const second = f.transactions.run(() =>
      f.notifications.claimNext(now + 60000, now + 120000, "worker-b"),
    );
    assert.ok(second);
    f.notifications.markSent(second.id, "worker-a", now + 60000);
    assert.equal(
      f.database.prepare("SELECT sent_at FROM offer_notifications").get()
        ?.sent_at,
      null,
    );
    f.notifications.markSent(second.id, "worker-b", now + 60000);
    assert.equal(
      f.transactions.run(() =>
        f.notifications.claimNext(now + 120000, now + 180000, "worker-c"),
      ),
      null,
    );
  } finally {
    f.database.close();
  }
});

test("si falla el aviso al ampliar cupos se revierten la edición, versión y ofertas", () => {
  const f = fixture();
  try {
    const management = new MatchManagementService({
      matches: f.matches,
      players: new SqlitePlayerRepository(f.database),
      waitlist: f.waitlist,
      transactions: f.transactions,
      clock: { now: () => f.now },
    });
    const original = f.matches.findById("match")!;
    const { id: _, organizer, players: __, version, ...fields } = original;
    f.notifications.enqueue = () => {
      throw new Error("fallo del aviso de edición");
    };
    assert.throws(
      () =>
        management.update(
          "match",
          { ...fields, expectedVersion: version, capacity: 3 },
          organizer.id,
        ),
      /fallo del aviso de edición/,
    );
    assert.equal(f.matches.findById("match")!.version, 1);
    assert.equal(f.matches.findById("match")!.capacity, 2);
    assert.equal(f.entries.findActive("match")[0].status, "waiting");
  } finally {
    f.database.close();
  }
});

test("si falla la inscripción de un invitado también se revierten su identidad y marcador", () => {
  const f = fixture();
  try {
    const management = new MatchManagementService({
      matches: f.matches,
      players: new SqlitePlayerRepository(f.database),
      waitlist: f.waitlist,
      transactions: f.transactions,
      clock: { now: () => f.now },
    });
    const match = f.matches.findById("match")!;
    const { organizer: _, players: __, id: ___, ...fields } = match;
    f.matches.update("match", { ...fields, capacity: 4 });
    f.database.exec(
      `CREATE TRIGGER fail_guest BEFORE INSERT ON participants WHEN NEW.person_id='new-guest' BEGIN SELECT RAISE(ABORT,'fallo al inscribir'); END;`,
    );
    assert.throws(
      () =>
        management.addPlayer(
          "match",
          { kind: "guest", name: "Invitado", guestId: "new-guest" },
          match.organizer.id,
        ),
      /fallo al inscribir/,
    );
    assert.equal(
      f.database
        .prepare("SELECT count(*) AS count FROM people WHERE id='new-guest'")
        .get()!.count,
      0,
    );
    assert.equal(
      f.database
        .prepare(
          "SELECT count(*) AS count FROM guest_players WHERE person_id='new-guest'",
        )
        .get()!.count,
      0,
    );
    assert.equal(f.entries.findActive("match")[0].status, "waiting");
  } finally {
    f.database.close();
  }
});
