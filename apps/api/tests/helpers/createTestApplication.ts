import type { OfferEmail } from "../../src/services/interfaces/OfferMailer.ts";
import assert from "node:assert/strict";
import { once } from "node:events";
import type {
  LoginEmail,
  MagicLinkMailer,
} from "../../src/services/interfaces/MagicLinkMailer.ts";
import { createApplication } from "../../src/bootstrap.ts";

export async function createTestApplication(filename = ":memory:") {
  let now = Date.now();
  let people = 0;
  const messages: LoginEmail[] = [];
  const offers: OfferEmail[] = [];
  let mailFails = false;
  const mailer: MagicLinkMailer = {
    deliveryMode: "local",
    send: async (message) => {
      messages.push(message);
    },
  };
  const application = createApplication({
    databasePath: filename,
    mailer,
    offerMailer: {
      deliveryMode: "local",
      send: async (message) => {
        if (mailFails) throw new Error("fallo de correo de prueba");
        offers.push(message);
      },
    },
    jobIntervalMs: 20,
    clock: { now: () => new Date(now) },
    allowedOrigins: ["http://127.0.0.1:5173", "http://localhost:5173"],
  });
  const server = application.app.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
  } catch (error) {
    await application.close();
    throw error;
  }
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;

  async function request(
    url: string,
    method = "GET",
    body?: unknown,
    cookie?: string,
    headers: Record<string, string> = {},
  ) {
    const response = await fetch(base + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
      setCookies: response.headers.getSetCookie(),
    };
  }

  async function requestAccess(
    name: string,
    email: string,
    returnTo = "/",
    cookie?: string,
  ) {
    const result = await request(
      "/api/session/request-link",
      "POST",
      { name, email, returnTo },
      cookie,
    );
    assert.equal(result.status, 202);
    assert.ok(result.cookie);
    const message = messages.at(-1);
    assert.ok(message);
    const token = new URLSearchParams(new URL(message.url).hash.slice(1)).get(
      "token",
    );
    assert.ok(token);
    return { token, flow: result.cookie, result };
  }
  async function person(name: string, email?: string) {
    const access = await requestAccess(
      name,
      email ?? `person-${++people}@example.test`,
    );
    const result = await request(
      "/api/session/verify",
      "POST",
      { token: access.token },
      access.flow,
    );
    assert.equal(result.status, 200);
    assert.ok(result.cookie);
    return result.cookie;
  }

  let closed = false;
  async function close() {
    if (closed) return;
    closed = true;
    try {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    } finally {
      await application.close();
    }
  }

  return {
    base,
    request,
    person,
    requestAccess,
    messages,
    offers,
    runMaintenance: application.runMaintenance,
    startBackgroundJobs: application.startBackgroundJobs,
    now: () => now,
    failOfferMail: (fail: boolean) => {
      mailFails = fail;
    },
    close,
    advanceBy: (milliseconds: number) => {
      now += milliseconds;
    },
    advanceTo: (timestamp: number) => {
      now = timestamp;
    },
  };
}
