import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CryptoSessionTokens } from "../../src/security/CryptoSessionTokens.ts";
import { createTestApplication } from "../helpers/createTestApplication.ts";

async function fixture() {
  const directory = mkdtempSync(path.join(tmpdir(), "busco-legacy-"));
  const filename = path.join(directory, "legacy.sqlite");
  const database = new DatabaseSync(filename);
  // Esquema anterior al acceso por correo: la migración debe abrirlo sin perder datos.
  database.exec(`CREATE TABLE people(id TEXT PRIMARY KEY,name TEXT NOT NULL);
    CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,person_id TEXT NOT NULL REFERENCES people(id),expires_at INTEGER NOT NULL);
    CREATE TABLE matches(id TEXT PRIMARY KEY,sport TEXT NOT NULL,title TEXT NOT NULL,starts_at TEXT NOT NULL,time_zone TEXT NOT NULL,venue TEXT NOT NULL,capacity INTEGER NOT NULL,price INTEGER,currency TEXT NOT NULL,notes TEXT NOT NULL,organizer_id TEXT NOT NULL REFERENCES people(id));
    CREATE TABLE participants(match_id TEXT NOT NULL REFERENCES matches(id),person_id TEXT NOT NULL REFERENCES people(id),joined_at TEXT NOT NULL,PRIMARY KEY(match_id,person_id));`);
  const tokens = new CryptoSessionTokens();
  const raw = tokens.issue();
  database
    .prepare("INSERT INTO people VALUES (?,?)")
    .run("legacy", "Pedro anterior");
  database
    .prepare("INSERT INTO sessions VALUES (?,?,?)")
    .run(tokens.hash(raw), "legacy", Date.now() + 86400000);
  database
    .prepare("INSERT INTO matches VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .run(
      "legacy-match",
      "Fútbol 5",
      "Partido anterior",
      new Date(Date.now() + 86400000).toISOString(),
      "America/Montevideo",
      "Cancha Centro",
      2,
      25000,
      "UYU",
      "",
      "legacy",
    );
  database
    .prepare("INSERT INTO participants VALUES (?,?,?)")
    .run("legacy-match", "legacy", new Date().toISOString());
  database.close();
  const app = await createTestApplication(filename);
  return {
    ...app,
    legacy: `bp_session=${raw}`,
    close: async () => {
      await app.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
test("una base anterior conserva partidos y vincula su identidad solo al verificar el correo", async () => {
  const f = await fixture();
  try {
    const previous = (
      await f.request("/api/session", "GET", undefined, f.legacy)
    ).body.person;
    assert.equal(previous.email, null);
    assert.equal(
      (await f.request("/api/matches", "GET", undefined, f.legacy)).status,
      401,
    );
    const access = await f.requestAccess(
      "Nombre nuevo",
      "pedro@example.test",
      "/",
      f.legacy,
    );
    const verified = await f.request(
      "/api/session/verify",
      "POST",
      { token: access.token },
      `${f.legacy}; ${access.flow}`,
    );
    assert.equal(verified.status, 200);
    assert.equal(verified.body.person.id, "legacy");
    assert.equal(verified.body.person.name, "Pedro anterior");
    assert.equal(
      (await f.request("/api/session", "GET", undefined, f.legacy)).body.person,
      null,
    );
    const list = await f.request(
      "/api/matches",
      "GET",
      undefined,
      verified.cookie,
    );
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].confirmed, 1);
    f.advanceBy(60000);
    const other = await f.person("Pedro", "pedro@example.test");
    assert.equal(
      (await f.request("/api/session", "GET", undefined, other)).body.person.id,
      "legacy",
    );
  } finally {
    await f.close();
  }
});
test("vincular una sesión anterior a una cuenta existente combina cupos y organización sin duplicar", async () => {
  const f = await fixture();
  try {
    const account = await f.person("Cuenta verificada", "pedro@example.test");
    const id = (await f.request("/api/session", "GET", undefined, account)).body
      .person.id;
    assert.equal(
      (
        await f.request(
          "/api/matches/legacy-match/participation",
          "PUT",
          undefined,
          account,
        )
      ).body.confirmed,
      2,
    );
    f.advanceBy(60000);
    const access = await f.requestAccess(
      "Pedro anterior",
      "pedro@example.test",
      "/",
      f.legacy,
    );
    const verified = await f.request(
      "/api/session/verify",
      "POST",
      { token: access.token },
      `${f.legacy}; ${access.flow}`,
    );
    assert.equal(verified.status, 200);
    assert.equal(verified.body.person.id, id);
    const match = (
      await f.request("/api/matches/legacy-match", "GET", undefined, account)
    ).body;
    assert.equal(match.confirmed, 1);
    assert.equal(match.organizer.id, id);
    assert.equal(match.isOrganizer, true);
    assert.equal(
      (await f.request("/api/session", "GET", undefined, f.legacy)).body.person,
      null,
    );
  } finally {
    await f.close();
  }
});
