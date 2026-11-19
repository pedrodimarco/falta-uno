import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { initializeSchema } from "../../src/database/schema.ts";
import { applyMigrations } from "../../src/database/migrations.ts";

test("migrar el esquema anterior conserva identidades, partidos y participantes y solo se aplica una vez", () => {
  const db = new DatabaseSync(":memory:");
  try {
    initializeSchema(db);
    db.exec(`INSERT INTO people VALUES ('organizer','Ana');
      INSERT INTO matches VALUES ('match','Pádel','Partido','2035-01-01T20:00:00Z','America/Montevideo','Club',4,NULL,'UYU','','organizer');
      INSERT INTO participants VALUES ('match','organizer','2030-01-01T00:00:00Z');`);
    applyMigrations(db);
    applyMigrations(db);
    assert.equal(
      db.prepare("SELECT version FROM matches WHERE id='match'").get()!.version,
      1,
    );
    assert.equal(
      db.prepare("SELECT count(*) AS count FROM participants").get()!.count,
      1,
    );
    assert.equal(
      db.prepare("SELECT name FROM people WHERE id='organizer'").get()!.name,
      "Ana",
    );
    assert.equal(
      db.prepare("SELECT count(*) AS count FROM schema_migrations").get()!
        .count,
      1,
    );
  } finally {
    db.close();
  }
});
test("una migración fallida revierte el cambio de columnas y permite reintentar", () => {
  const db = new DatabaseSync(":memory:");
  try {
    initializeSchema(db);
    db.exec("CREATE TABLE guest_players(dummy TEXT)");
    assert.throws(() => applyMigrations(db));
    assert.ok(
      !db
        .prepare("PRAGMA table_info(matches)")
        .all()
        .some((row) => row.name === "version"),
    );
    assert.equal(
      db.prepare("SELECT count(*) AS count FROM schema_migrations").get()!
        .count,
      0,
    );
    db.exec("DROP TABLE guest_players");
    applyMigrations(db);
    assert.ok(
      db
        .prepare("PRAGMA table_info(matches)")
        .all()
        .some((row) => row.name === "version"),
    );
  } finally {
    db.close();
  }
});
