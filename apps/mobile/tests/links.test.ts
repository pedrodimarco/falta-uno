import { test } from "node:test";
import assert from "node:assert/strict";
import { loginToken } from "../src/features/session/loginLink.ts";
import { matchIdFromLink } from "../src/features/matches/matchLink.ts";
test("acceso extrae el fragmento del correo y rechaza textos o rutas ajenas", () => {
  const token = "a".repeat(64);
  assert.equal(
    loginToken(`http://localhost:5173/acceso#token=${token}`),
    token,
  );
  assert.throws(() =>
    loginToken(`https://example.test/partidos#token=${token}`),
  );
  assert.throws(() => loginToken("javascript:alert(1)"));
});
test("invitaciones admiten enlaces web y nativos, sin navegar a hosts pegados", () => {
  const id = "f70cda2e-5503-4e57-9495-d6700cb4e871";
  assert.equal(matchIdFromLink(`http://localhost:5173/partidos/${id}`), id);
  assert.equal(matchIdFromLink(`busco-player://partidos/${id}`), id);
  assert.throws(() => matchIdFromLink("https://example.test/partidos/nuevo"));
  assert.throws(() =>
    matchIdFromLink("https://example.test/partidos/abc/extra"),
  );
});
