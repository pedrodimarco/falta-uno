import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createTestApplication as fixture } from "../helpers/createTestApplication.ts";

const input = {
  sport: "Fútbol 5",
  title: "El fútbol del jueves",
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  timeZone: "America/Montevideo",
  venue: "Cancha Centro",
  capacity: 2,
  price: 25000,
  currency: "UYU",
  notes: "Llevá remera clara.",
  organizerPlays: true,
};
test("crear, consultar públicamente y ver mis partidos sin exponer sesión", async () => {
  const f = await fixture();
  try {
    const cookie = await f.person("Pedro");
    const created = await f.request("/api/matches", "POST", input, cookie);
    assert.equal(created.status, 201);
    assert.equal(created.body.confirmed, 1);
    assert.equal(created.body.joined, true);
    const publicView = await f.request(`/api/matches/${created.body.id}`);
    assert.equal(publicView.status, 200);
    assert.equal(publicView.body.joined, false);
    assert.equal(publicView.body.isOrganizer, false);
    assert.equal(publicView.body.organizer.name, "Pedro");
    assert.equal((await f.request("/api/matches")).status, 401);
    assert.equal(
      (await f.request("/api/matches", "GET", undefined, cookie)).body.length,
      1,
    );
  } finally {
    await f.close();
  }
});
test("último cupo concurrente, confirmación idempotente y cancelación propia", async () => {
  const f = await fixture();
  try {
    const organizer = await f.person("Pedro"),
      a = await f.person("Martín"),
      b = await f.person("Diego");
    const created = await f.request("/api/matches", "POST", input, organizer);
    const url = `/api/matches/${created.body.id}/participation`;
    const results = await Promise.all([
      f.request(url, "PUT", undefined, a),
      f.request(url, "PUT", undefined, b),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    const winner = results[0].status === 200 ? a : b;
    const loser = winner === a ? b : a;
    assert.equal(
      (await f.request(url, "PUT", undefined, winner)).body.confirmed,
      2,
    );
    // Un jugador no puede cancelar a otro: el servidor ignora personId y usa la sesión.
    const unauthorized = await f.request(
      url,
      "DELETE",
      { personId: created.body.organizer.id },
      loser,
    );
    assert.equal(unauthorized.body.confirmed, 2);
    const leave = await f.request(url, "DELETE", undefined, winner);
    assert.equal(leave.body.confirmed, 1);
    assert.equal(
      (await f.request(url, "DELETE", undefined, winner)).body.confirmed,
      1,
    );
    assert.equal(
      (await f.request(url, "PUT", undefined, loser)).body.confirmed,
      2,
    );
    assert.equal((await f.request(url, "DELETE")).status, 401);
  } finally {
    await f.close();
  }
});
test("validación, enlaces inexistentes y origen ajeno", async () => {
  const f = await fixture();
  try {
    const cookie = await f.person("Pedro");
    assert.equal(
      (
        await f.request(
          "/api/matches",
          "POST",
          { ...input, capacity: 1 },
          cookie,
        )
      ).status,
      422,
    );
    assert.equal(
      (
        await f.request(
          "/api/matches",
          "POST",
          { ...input, startsAt: "2000-01-01T00:00:00Z" },
          cookie,
        )
      ).status,
      422,
    );
    assert.equal(
      (
        await f.request(
          "/api/matches",
          "POST",
          { ...input, timeZone: "inventada" },
          cookie,
        )
      ).status,
      422,
    );
    assert.equal((await f.request("/api/matches/no-existe")).status, 404);
    assert.equal(
      (
        await f.request(
          "/api/session/request-link",
          "POST",
          { name: "Intruso" },
          undefined,
          { Origin: "https://otro-sitio.example" },
        )
      ).status,
      403,
    );
    assert.equal(
      (await f.request("/api/session/request-link", "POST", { name: " " }))
        .status,
      422,
    );
    assert.equal(
      (
        await f.request(
          "/api/session/request-link",
          "POST",
          { name: "Jugador del proxy", email: "proxy@example.test" },
          undefined,
          { Origin: "http://127.0.0.1:5173" },
        )
      ).status,
      202,
    );
    const malformed = await fetch(f.base + "/api/session/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{incompleto",
    });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).code, "INVALID_JSON");
  } finally {
    await f.close();
  }
});
test("los datos y la identidad persisten al reabrir la base", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "falta-uno-test-"));
  const filename = path.join(directory, "test.sqlite");
  let f = await fixture(filename);
  try {
    const cookie = await f.person("Pedro");
    const created = await f.request("/api/matches", "POST", input, cookie);
    await f.close();
    f = await fixture(filename);
    const read = await f.request(
      `/api/matches/${created.body.id}`,
      "GET",
      undefined,
      cookie,
    );
    assert.equal(read.body.title, input.title);
    assert.equal(read.body.joined, true);
    assert.equal(read.body.confirmed, 1);
  } finally {
    await f.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
test("partido comenzado cierra altas y bajas, incluso si quedan cupos", async () => {
  const f = await fixture();
  try {
    const cookie = await f.person("Pedro");
    const created = await f.request("/api/matches", "POST", input, cookie);
    f.advanceTo(Date.parse(input.startsAt));
    const url = `/api/matches/${created.body.id}/participation`;
    assert.equal((await f.request(url, "PUT", undefined, cookie)).status, 409);
    assert.equal(
      (await f.request(url, "DELETE", undefined, cookie)).status,
      409,
    );
    assert.equal(
      (await f.request(`/api/matches/${created.body.id}`)).body.closed,
      true,
    );
  } finally {
    await f.close();
  }
});
