import { test } from "node:test";
import assert from "node:assert/strict";
import { createTestApplication as fixture } from "../helpers/createTestApplication.ts";

test("solicitar un enlace no autentica ni expone el token, y ya no existe acceso solo por nombre", async () => {
  const f = await fixture();
  try {
    const result = await f.request("/api/session/request-link", "POST", {
      name: "Pedro",
      email: "pedro@example.test",
    });
    assert.equal(result.status, 202);
    assert.ok(result.cookie?.startsWith("bp_login_flow="));
    assert.equal(result.body.token, undefined);
    assert.equal(result.body.person, undefined);
    assert.equal(result.body.url, undefined);
    assert.equal(
      (await f.request("/api/session", "GET", undefined, result.cookie)).body
        .person,
      null,
    );
    assert.equal(
      (await f.request("/api/session", "POST", { name: "Pedro" })).status,
      404,
    );
    assert.equal((await f.request("/api/matches")).status, 401);
    assert.match(result.setCookies[0], /HttpOnly/);
    assert.match(result.setCookies[0], /SameSite=Lax/);
  } finally {
    await f.close();
  }
});
test("verificación concurrente: solo una sesión y el enlace no se puede reutilizar", async () => {
  const f = await fixture();
  try {
    const access = await f.requestAccess(
      "Pedro",
      "pedro@example.test",
      "/partidos/nuevo",
    );
    assert.equal(
      (await f.request("/api/session/verify", "POST", { token: access.token }))
        .status,
      400,
    );
    const results = await Promise.all([
      f.request(
        "/api/session/verify",
        "POST",
        { token: access.token },
        access.flow,
      ),
      f.request(
        "/api/session/verify",
        "POST",
        { token: access.token },
        access.flow,
      ),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
    const success = results.find((r) => r.status === 200)!;
    assert.equal(success.body.person.email, "pedro@example.test");
    assert.equal(success.body.returnTo, "/partidos/nuevo");
    assert.equal(success.body.token, undefined);
    assert.ok(success.cookie?.startsWith("bp_session="));
    assert.match(success.setCookies[0], /HttpOnly/);
    assert.equal(
      (
        await f.request(
          "/api/session/verify",
          "POST",
          { token: access.token },
          access.flow,
        )
      ).status,
      400,
    );
  } finally {
    await f.close();
  }
});
test("mismo correo en dos navegadores: un cupo y cierre de sesión independiente", async () => {
  const f = await fixture();
  try {
    const first = await f.person("Pedro", "pedro@example.test");
    f.advanceBy(60_000);
    const second = await f.person("Nombre diferente", "PEDRO@example.test");
    const a = (await f.request("/api/session", "GET", undefined, first)).body
      .person;
    const b = (await f.request("/api/session", "GET", undefined, second)).body
      .person;
    assert.equal(a.id, b.id);
    assert.equal(b.name, "Pedro");
    const match = await f.request(
      "/api/matches",
      "POST",
      {
        sport: "Pádel",
        title: "Partido entre amigos",
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        timeZone: "America/Montevideo",
        venue: "Cancha Centro",
        capacity: 4,
        price: null,
        currency: "UYU",
        notes: "",
        organizerPlays: true,
      },
      first,
    );
    assert.equal(match.status, 201);
    assert.equal(
      (
        await f.request(
          `/api/matches/${match.body.id}/participation`,
          "PUT",
          undefined,
          second,
        )
      ).body.confirmed,
      1,
    );
    assert.equal(
      (await f.request(`/api/matches/${match.body.id}`)).body.organizer.email,
      undefined,
    );
    const response = await fetch(f.base + "/api/session", {
      method: "DELETE",
      headers: { Cookie: first },
    });
    assert.equal(response.status, 204);
    assert.equal(
      (await f.request("/api/session", "GET", undefined, first)).body.person,
      null,
    );
    assert.equal(
      (await f.request("/api/session", "GET", undefined, second)).body.person
        .id,
      a.id,
    );
    f.advanceBy(30 * 86400000);
    assert.equal(
      (await f.request("/api/matches", "GET", undefined, second)).status,
      401,
    );
  } finally {
    await f.close();
  }
});
test("enlace vencido, límites persistidos y destino externo bloqueado", async () => {
  const f = await fixture();
  try {
    const access = await f.requestAccess(
      "Pedro",
      "pedro@example.test",
      "https://evil.test",
    );
    assert.equal(
      (
        await f.request("/api/session/request-link", "POST", {
          name: "Pedro",
          email: "pedro@example.test",
        })
      ).status,
      429,
    );
    f.advanceBy(10 * 60000);
    assert.equal(
      (
        await f.request(
          "/api/session/verify",
          "POST",
          { token: access.token },
          access.flow,
        )
      ).body.code,
      "INVALID_LOGIN_LINK",
    );
    const next = await f.requestAccess(
      "Pedro",
      "pedro@example.test",
      "//evil.test",
    );
    assert.equal(
      (
        await f.request(
          "/api/session/verify",
          "POST",
          { token: next.token },
          next.flow,
        )
      ).body.returnTo,
      "/",
    );
  } finally {
    await f.close();
  }
});
