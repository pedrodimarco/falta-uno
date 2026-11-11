import { test } from "node:test";
import assert from "node:assert/strict";
import { createTestApplication as fixture } from "../helpers/createTestApplication.ts";

async function requestMobile(
  f: Awaited<ReturnType<typeof fixture>>,
  email = "mobile@example.test",
) {
  const result = await f.request("/api/mobile/session/request-link", "POST", {
    name: "Ana",
    email,
  });
  assert.equal(result.status, 202);
  assert.equal(result.setCookies.length, 0);
  assert.match(result.body.flowToken, /^[a-f0-9]{64}$/);
  assert.equal(result.body.token, undefined);
  assert.equal(result.body.url, undefined);
  const token = new URLSearchParams(
    new URL(f.messages.at(-1)!.url).hash.slice(1),
  ).get("token")!;
  return { token, flowToken: result.body.flowToken };
}

test("móvil: enlace ligado a la solicitud, uso único y sesión Bearer revocable", async () => {
  const f = await fixture();
  try {
    const input = await requestMobile(f);
    assert.equal(
      (
        await f.request("/api/mobile/session/verify", "POST", {
          ...input,
          flowToken: "a".repeat(64),
        })
      ).status,
      400,
    );
    const verified = await f.request(
      "/api/mobile/session/verify",
      "POST",
      input,
    );
    assert.equal(verified.status, 200);
    assert.equal(verified.setCookies.length, 0);
    assert.match(verified.body.token, /^[a-f0-9]{64}$/);
    const headers = { Authorization: `Bearer ${verified.body.token}` };
    assert.equal(
      (
        await f.request(
          "/api/mobile/session",
          "GET",
          undefined,
          undefined,
          headers,
        )
      ).body.person.email,
      "mobile@example.test",
    );
    assert.equal(
      (await f.request("/api/matches", "GET", undefined, undefined, headers))
        .status,
      200,
    );
    assert.equal(
      (await f.request("/api/mobile/session/verify", "POST", input)).status,
      400,
    );
    assert.equal(
      (
        await fetch(f.base + "/api/mobile/session", {
          method: "DELETE",
          headers,
        })
      ).status,
      204,
    );
    assert.equal(
      (await f.request("/api/matches", "GET", undefined, undefined, headers))
        .status,
      401,
    );
  } finally {
    await f.close();
  }
});

test("web y móvil comparten cuenta y partidos, pero cierran sesiones independientemente", async () => {
  const f = await fixture();
  try {
    const cookie = await f.person("Ana", "shared@example.test");
    f.advanceBy(60_000);
    const input = await requestMobile(f, "shared@example.test");
    const mobile = await f.request("/api/mobile/session/verify", "POST", input);
    const web = await f.request("/api/session", "GET", undefined, cookie);
    assert.equal(web.body.person.id, mobile.body.person.id);
    const headers = { Authorization: `Bearer ${mobile.body.token}` };
    const match = await f.request(
      "/api/matches",
      "POST",
      {
        sport: "Pádel",
        title: "Pádel desde el celular",
        startsAt: new Date(f.now() + 86_400_000).toISOString(),
        timeZone: "America/Montevideo",
        venue: "Club Centro",
        capacity: 4,
        price: 35000,
        currency: "UYU",
        notes: "",
        organizerPlays: true,
      },
      undefined,
      headers,
    );
    assert.equal(match.status, 201);
    assert.equal(
      (await f.request("/api/matches", "GET", undefined, cookie)).body[0].id,
      match.body.id,
    );
    assert.equal(
      (
        await f.request("/api/matches", "GET", undefined, cookie, {
          Authorization: "Bearer invalid",
        })
      ).status,
      401,
    );
    // Las rutas nativas no aceptan cookies como sustituto del Bearer.
    assert.equal(
      (await f.request("/api/mobile/session", "GET", undefined, cookie)).body
        .person,
      null,
    );
    await fetch(f.base + "/api/mobile/session", { method: "DELETE", headers });
    assert.equal(
      (await f.request("/api/matches", "GET", undefined, cookie)).status,
      200,
    );
  } finally {
    await f.close();
  }
});

test("móvil: vencimiento y límites usan las mismas reglas que web", async () => {
  const f = await fixture();
  try {
    const input = await requestMobile(f);
    assert.equal(
      (
        await f.request("/api/session/request-link", "POST", {
          name: "Ana",
          email: "mobile@example.test",
        })
      ).status,
      429,
    );
    f.advanceBy(10 * 60_000);
    assert.equal(
      (await f.request("/api/mobile/session/verify", "POST", input)).body.code,
      "INVALID_LOGIN_LINK",
    );
    const next = await requestMobile(f);
    const verified = await f.request(
      "/api/mobile/session/verify",
      "POST",
      next,
    );
    f.advanceBy(30 * 86_400_000);
    assert.equal(
      (
        await f.request("/api/matches", "GET", undefined, undefined, {
          Authorization: `Bearer ${verified.body.token}`,
        })
      ).status,
      401,
    );
  } finally {
    await f.close();
  }
});

test("CORS permite solo orígenes configurados y preserva el control de origen", async () => {
  const f = await fixture();
  try {
    const allowed = "http://127.0.0.1:5173";
    const preflight = await fetch(f.base + "/api/mobile/session/verify", {
      method: "OPTIONS",
      headers: {
        Origin: allowed,
        "Access-Control-Request-Headers": "authorization,content-type",
        "Access-Control-Request-Method": "POST",
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), allowed);
    assert.match(
      preflight.headers.get("access-control-allow-headers")!,
      /Authorization/,
    );
    const blocked = await f.request(
      "/api/mobile/session/request-link",
      "POST",
      { name: "Ana", email: "ana@example.test" },
      undefined,
      { Origin: "https://evil.test" },
    );
    assert.equal(blocked.status, 403);
    const read = await fetch(f.base + "/api/mobile/session", {
      headers: { Origin: "https://evil.test" },
    });
    assert.equal(read.headers.get("access-control-allow-origin"), null);
  } finally {
    await f.close();
  }
});
