import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionService } from "../../src/services/SessionService.ts";
import {
  SESSION_TTL_MS,
  LOGIN_LINK_TTL_MS,
} from "../../src/services/interfaces/SessionUseCases.ts";
import { DomainError } from "../../src/errors/DomainError.ts";
import type {
  LoginEmail,
  MagicLinkMailer,
} from "../../src/services/interfaces/MagicLinkMailer.ts";
import {
  MemorySessionRepository,
  MemoryLoginLinkRepository,
} from "../helpers/MemoryAuthRepositories.ts";
const hasCode = (code: string) => (error: unknown) =>
  error instanceof DomainError && error.code === code;
function fixture() {
  let now = 0,
    ids = 0,
    issued = 0;
  const messages: LoginEmail[] = [];
  const sessions = new MemorySessionRepository(),
    links = new MemoryLoginLinkRepository();
  const mailer: MagicLinkMailer = {
    deliveryMode: "local",
    send: async (message) => {
      messages.push(message);
    },
  };
  const service = new SessionService({
    sessions,
    links,
    transactions: { run: (operation) => operation() },
    clock: { now: () => new Date(now) },
    generateId: () => `person-${++ids}`,
    tokens: {
      issue: () => (++issued).toString(16).padStart(64, "0"),
      hash: (token) => `hash:${token}`,
      isValid: (token) => /^[a-f0-9]{64}$/.test(token),
    },
    mailer,
    publicUrl: "http://app.test",
  });
  async function request(
    email = "pedro@example.test",
    returnTo = "/",
    existingToken?: string,
  ) {
    const result = await service.requestLink({
      name: "Pedro",
      email,
      returnTo,
      ip: "ip",
      existingToken,
    });
    const token = new URLSearchParams(
      new URL(messages.at(-1)!.url).hash.slice(1),
    ).get("token")!;
    return { token, flow: result.flowToken };
  }
  return {
    service,
    sessions,
    links,
    messages,
    mailer,
    request,
    advanceTo: (time: number) => {
      now = time;
    },
  };
}
test("el enlace se guarda como hash, requiere el mismo navegador y es de un solo uso", async () => {
  const f = fixture();
  const link = await f.request();
  assert.equal(f.links.links.has(link.token), false);
  assert.throws(
    () => f.service.verify(link.token, "f".repeat(64)),
    hasCode("INVALID_LOGIN_LINK"),
  );
  const result = f.service.verify(link.token, link.flow);
  assert.equal(result.person.email, "pedro@example.test");
  assert.equal(f.sessions.sessions.has(result.token), false);
  assert.deepEqual(f.service.findPerson(result.token), result.person);
  assert.throws(
    () => f.service.verify(link.token, link.flow),
    hasCode("INVALID_LOGIN_LINK"),
  );
});
test("vence exactamente a los diez minutos y no crea identidad antes de verificar", async () => {
  const f = fixture();
  const link = await f.request();
  assert.equal(f.sessions.people.size, 0);
  assert.equal(f.sessions.sessions.size, 0);
  f.advanceTo(LOGIN_LINK_TTL_MS);
  assert.throws(
    () => f.service.verify(link.token, link.flow),
    hasCode("INVALID_LOGIN_LINK"),
  );
  assert.equal(f.sessions.people.size, 0);
});
test("el mismo correo recupera la identidad en otro dispositivo y conserva el nombre", async () => {
  const f = fixture();
  const first = await f.request("Pedro@Example.Test");
  const account = f.service.verify(first.token, first.flow);
  f.advanceTo(60_000);
  const second = await f.request("pedro@example.test");
  const other = f.service.verify(second.token, second.flow);
  assert.equal(other.person.id, account.person.id);
  assert.equal(f.sessions.people.size, 1);
  f.service.logout(account.token);
  assert.equal(f.service.findPerson(account.token), null);
  assert.ok(f.service.findPerson(other.token));
  f.advanceTo(60_000 + SESSION_TTL_MS);
  assert.equal(f.service.findPerson(other.token), null);
});
test("limita solicitudes y descarta destinos de retorno externos", async () => {
  const f = fixture();
  const link = await f.request("pedro@example.test", "//evil.test");
  await assert.rejects(() => f.request(), hasCode("AUTH_RATE_LIMIT"));
  assert.equal(f.service.verify(link.token, link.flow).returnTo, "/");
});
test("si falla preparar el correo se invalida el enlace y no se crea sesión", async () => {
  const f = fixture();
  f.mailer.send = async () => {
    throw new Error("fallo de entrega");
  };
  await assert.rejects(() => f.request(), hasCode("MAIL_UNAVAILABLE"));
  assert.equal(f.links.links.size, 0);
  assert.equal(f.sessions.sessions.size, 0);
});
