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
