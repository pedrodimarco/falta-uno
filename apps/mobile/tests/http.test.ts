import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createHttpClient,
  ApiError,
} from "../src/shared/api/createHttpClient.ts";

test("cliente móvil envía Bearer sin cookies y acepta 204 al cerrar sesión", async () => {
  const http = createHttpClient({
    baseUrl: "http://api.test",
    getToken: async () => "credential",
    onUnauthorized: async () => {},
    fetcher: async (url, options) => {
      assert.equal(url, "http://api.test/api/mobile/session");
      assert.equal(options?.credentials, "omit");
      assert.equal(
        new Headers(options?.headers).get("authorization"),
        "Bearer credential",
      );
      return new Response(null, { status: 204 });
    },
  });
  assert.equal(await http("/mobile/session", { method: "DELETE" }), undefined);
});
test("cliente avisa sesión vencida ante 401, pero conserva sesión ante conflictos", async () => {
  const expired: string[] = [];
  let status = 409;
  const http = createHttpClient({
    baseUrl: "http://api.test",
    getToken: async () => "credential",
    onUnauthorized: async (token) => {
      expired.push(token);
    },
    fetcher: async () =>
      Response.json({ error: "No disponible", code: "CONFLICT" }, { status }),
  });
  await assert.rejects(
    http("/matches"),
    (error) => error instanceof ApiError && error.status === 409,
  );
  assert.deepEqual(expired, []);
  status = 401;
  await assert.rejects(
    http("/matches"),
    (error) => error instanceof ApiError && error.status === 401,
  );
  assert.deepEqual(expired, ["credential"]);
});
