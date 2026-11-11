import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../src/database/connection.ts";
import { SqliteTransactionManager } from "../../src/database/SqliteTransactionManager.ts";
import { SqliteMatchRepository } from "../../src/repositories/sqlite/SqliteMatchRepository.ts";
import { SqliteSessionRepository } from "../../src/repositories/sqlite/SqliteSessionRepository.ts";
import type { MatchRecord } from "../../src/models/Match.ts";

const match: MatchRecord = {
  id: "match",
  organizerId: "organizer",
  sport: "Pádel",
  title: "Partido de prueba",
  startsAt: "2030-01-02T20:00:00.000Z",
  timeZone: "America/Montevideo",
  venue: "Cancha Centro",
  capacity: 4,
  price: null,
  currency: "UYU",
  notes: "",
};

test("SQLite revierte la creación completa si falla una inscripción y permite reintentar", () => {
  const database = openDatabase(":memory:");
  try {
    const transactions = new SqliteTransactionManager(database);
    const matches = new SqliteMatchRepository(database);
    const sessions = new SqliteSessionRepository(database);
    sessions.insertPerson({ id: "organizer", name: "Pedro" });
    assert.throws(() =>
      transactions.run(() => {
        matches.insert(match);
        matches.addParticipant(match.id, "persona-inexistente", match.startsAt);
      }),
    );
    assert.equal(matches.findById(match.id), null);
    transactions.run(() => {
      matches.insert(match);
      matches.addParticipant(match.id, match.organizerId, match.startsAt);
    });
    assert.deepEqual(matches.findById(match.id)?.players, [
      { id: "organizer", name: "Pedro" },
    ]);
  } finally {
    database.close();
  }
});

test("la identidad y su sesión se revierten juntas cuando falla la persistencia", () => {
  const database = openDatabase(":memory:");
  try {
    const transactions = new SqliteTransactionManager(database);
    const sessions = new SqliteSessionRepository(database);
    assert.throws(() =>
      transactions.run(() => {
        sessions.insertPerson({ id: "person", name: "Pedro" });
        sessions.insertSession({
          tokenHash: "hash",
          personId: "missing",
          expiresAt: 100,
        });
      }),
    );
    assert.equal(
      database.prepare("SELECT count(*) AS count FROM people").get()?.count,
      0,
    );
    assert.equal(sessions.findPerson("hash", 0), null);
  } finally {
    database.close();
  }
});
