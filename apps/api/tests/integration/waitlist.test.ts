import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { createTestApplication } from "../helpers/createTestApplication.ts";

async function fixture(filename = ":memory:", startsIn = 12 * 3_600_000) {
  const f = await createTestApplication(filename);
  try {
    const organizer = await f.person("Organizador"),
      player = await f.person("Confirmado"),
      first = await f.person("Primero"),
      second = await f.person("Segundo"),
      outsider = await f.person("Tercero");
    const created = await f.request(
      "/api/matches",
      "POST",
      {
        sport: "Pádel",
        title: "Partido con espera",
        startsAt: new Date(f.now() + startsIn).toISOString(),
        timeZone: "America/Montevideo",
        venue: "Cancha Centro",
        capacity: 2,
        price: null,
        currency: "UYU",
        notes: "",
        organizerPlays: true,
      },
      organizer,
    );
    assert.equal(created.status, 201);
    const id = created.body.id;
    const base = `/api/matches/${id}`;
    assert.equal(
      (await f.request(base + "/participation", "PUT", undefined, player))
        .status,
      200,
    );
    const detail = async (cookie?: string) =>
      (await f.request(base, "GET", undefined, cookie)).body;
    async function queue(cookie: string) {
      const result = await f.request(
        base + "/waitlist",
        "PUT",
        undefined,
        cookie,
      );
      assert.equal(result.status, 200);
      return result.body;
    }
    async function cancelPlayer() {
      const result = await f.request(
        base + "/participation",
        "DELETE",
        undefined,
        player,
      );
      assert.equal(result.status, 200);
      return result.body;
    }
    return {
      ...f,
      id,
      base,
      organizer,
      player,
      first,
      second,
      outsider,
      detail,
      queue,
      cancelPlayer,
    };
  } catch (error) {
    await f.close();
    throw error;
  }
}

test("orden estable con la misma fecha, inscripción idempotente, salida y reingreso al final", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.queue(f.first)).waitlistPosition, 1);
    assert.equal((await f.queue(f.second)).waitlistPosition, 2);
    const duplicate = await f.queue(f.first);
    assert.equal(duplicate.waitlistPosition, 1);
    assert.equal(duplicate.waitingList.length, 2);
    const ownList = await f.request("/api/matches", "GET", undefined, f.first);
    assert.ok(ownList.body.some((match: { id: string }) => match.id === f.id));
    assert.equal(
      (await f.request(f.base + "/waitlist", "DELETE", undefined, f.first)).body
        .waitlistState,
      "left",
    );
    assert.equal((await f.detail(f.second)).waitlistPosition, 1);
    assert.equal((await f.queue(f.first)).waitlistPosition, 2);
    assert.equal((await f.request(f.base + "/waitlist", "PUT")).status, 401);
    assert.equal((await f.detail()).waitingList[0].person.email, undefined);
  } finally {
    await f.close();
  }
});

test("cancelar reserva el cupo al primero, impide adelantarse y aceptar no duplica participantes", async () => {
  const f = await fixture();
  try {
    await f.queue(f.first);
    await f.queue(f.second);
    await f.cancelPlayer();
    const first = await f.detail(f.first);
    assert.equal(first.confirmed, 1);
    assert.equal(first.reserved, 1);
    assert.ok(first.offer);
    assert.equal(Date.parse(first.offer.expiresAt), f.now() + 2 * 3_600_000);
    assert.equal((await f.detail(f.second)).offer, null);
    assert.equal((await f.detail()).offer, null);
    assert.equal(
      (await f.request(f.base + "/participation", "PUT", undefined, f.outsider))
        .status,
      409,
    );
    const endpoint = f.base + `/offers/${first.offer.id}/accept`;
    assert.equal(
      (await f.request(endpoint, "POST", undefined, f.second)).status,
      404,
    );
    const concurrent = await Promise.all([
      f.request(endpoint, "POST", undefined, f.first),
      f.request(endpoint, "POST", undefined, f.first),
    ]);
    assert.deepEqual(
      concurrent.map((r) => r.status),
      [200, 200],
    );
    const result = await f.detail(f.first);
    assert.equal(result.confirmed, 2);
    assert.equal(result.reserved, 0);
    assert.equal(result.joined, true);
    assert.equal(result.offer, null);
    await f.runMaintenance();
    assert.equal(f.offers.length, 0, "No avisar sobre una oferta ya aceptada.");
  } finally {
    await f.close();
  }
});

test("rechazar transfiere el lugar y una petición vieja no afecta una oferta nueva", async () => {
  const f = await fixture();
  try {
    await f.queue(f.first);
    await f.queue(f.second);
    await f.cancelPlayer();
    const old = (await f.detail(f.first)).offer;
    const decline = f.base + `/offers/${old.id}/decline`;
    assert.equal(
      (await f.request(decline, "POST", undefined, f.first)).status,
      200,
    );
    assert.ok((await f.detail(f.second)).offer);
    assert.equal((await f.queue(f.first)).waitlistPosition, 2);
    assert.equal(
      (await f.request(decline, "POST", undefined, f.first)).status,
      200,
    );
    assert.equal((await f.detail(f.first)).waitlistState, "waiting");
    assert.equal(
      (
        await f.request(
          f.base + `/offers/${old.id}/accept`,
          "POST",
          undefined,
          f.first,
        )
      ).status,
      409,
    );
    const second = (await f.detail(f.second)).offer;
    await f.request(
      f.base + `/offers/${second.id}/decline`,
      "POST",
      undefined,
      f.second,
    );
    const next = (await f.detail(f.first)).offer;
    assert.ok(next);
    assert.notEqual(next.id, old.id);
    await f.request(decline, "POST", undefined, f.first);
    assert.equal((await f.detail(f.first)).offer.id, next.id);
  } finally {
    await f.close();
  }
});

test("salir durante una oferta pasa el lugar al siguiente y cancelar otra vez no libera un cupo extra", async () => {
  const f = await fixture();
  try {
    await f.queue(f.first);
    await f.queue(f.second);
    await f.cancelPlayer();
    await f.cancelPlayer();
    assert.equal((await f.detail()).reserved, 1);
    await f.request(f.base + "/waitlist", "DELETE", undefined, f.first);
    const second = await f.detail(f.second);
    assert.ok(second.offer);
    assert.equal(second.reserved, 1);
    assert.equal(second.waitlistPosition, 1);
    assert.equal((await f.detail(f.first)).waitlistState, "left");
  } finally {
    await f.close();
  }
});

test("vencimiento exacto y rechazo de aceptación tardía; mantenimiento ofrece al siguiente", async () => {
  const f = await fixture();
  try {
    await f.queue(f.first);
    await f.queue(f.second);
    await f.cancelPlayer();
    const offer = (await f.detail(f.first)).offer;
    f.advanceTo(Date.parse(offer.expiresAt));
    assert.equal(
      (
        await f.request(
          f.base + `/offers/${offer.id}/accept`,
          "POST",
          undefined,
          f.first,
        )
      ).status,
      409,
    );
    await f.runMaintenance();
    assert.equal((await f.detail(f.first)).waitlistState, "expired");
    const next = await f.detail(f.second);
    assert.ok(next.offer);
    assert.equal(next.confirmed + next.reserved, 2);
    assert.equal(f.offers.length, 1);
    assert.equal(f.offers[0].name, "Segundo");
  } finally {
    await f.close();
  }
});

test("el plazo se limita al comienzo y no se ofrecen lugares después del inicio", async () => {
  const f = await fixture(":memory:", 30 * 60_000);
  try {
    await f.queue(f.first);
    await f.queue(f.second);
    await f.cancelPlayer();
    const offer = (await f.detail(f.first)).offer;
    assert.equal(Date.parse(offer.expiresAt), f.now() + 30 * 60_000);
    f.advanceBy(30 * 60_000);
    await f.runMaintenance();
    const detail = await f.detail(f.second);
    assert.equal(detail.closed, true);
    assert.equal(detail.offer, null);
    assert.equal(detail.reserved, 0);
    assert.equal(detail.waitlistState, "closed");
    assert.equal(detail.waitingList.length, 0);
    assert.equal(f.offers.length, 0);
    assert.equal(
      (await f.request(f.base + "/waitlist", "PUT", undefined, f.outsider))
        .status,
      409,
    );
  } finally {
    await f.close();
  }
});

test("varias bajas reservan un cupo por persona sin exceder la capacidad", async () => {
  const f = await fixture();
  try {
    await f.queue(f.first);
    await f.queue(f.second);
    await f.queue(f.outsider);
    await Promise.all([
      f.cancelPlayer(),
      f.request(f.base + "/participation", "DELETE", undefined, f.organizer),
    ]);
    assert.equal((await f.detail()).reserved, 2);
    assert.equal((await f.detail()).confirmed, 0);
    const a = (await f.detail(f.first)).offer,
      b = (await f.detail(f.second)).offer;
    assert.ok(a);
    assert.ok(b);
    assert.equal((await f.detail(f.outsider)).offer, null);
    await Promise.all([
      f.request(f.base + `/offers/${a.id}/accept`, "POST", undefined, f.first),
      f.request(f.base + `/offers/${b.id}/accept`, "POST", undefined, f.second),
    ]);
    const result = await f.detail();
    assert.equal(result.confirmed, 2);
    assert.equal(result.reserved, 0);
  } finally {
    await f.close();
  }
});

test("se rechaza la espera cuando hay cupos libres y una persona confirmada no ocupa la lista", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.queue(f.organizer)).joined, true);
    assert.equal((await f.detail()).waitingList.length, 0);
    await f.cancelPlayer();
    assert.equal(
      (await f.request(f.base + "/waitlist", "PUT", undefined, f.first)).body
        .code,
      "WAITLIST_NOT_NEEDED",
    );
    assert.equal(
      (await f.request(f.base + "/participation", "PUT", undefined, f.first))
        .status,
      200,
    );
  } finally {
    await f.close();
  }
});

test("el aviso se reintenta tras fallar el correo sin perder la reserva ni duplicar entregas", async () => {
  const f = await fixture();
  try {
    await f.queue(f.first);
    await f.cancelPlayer();
    f.failOfferMail(true);
    await f.runMaintenance();
    assert.equal(f.offers.length, 0);
    assert.equal((await f.detail()).reserved, 1);
    f.failOfferMail(false);
    await f.runMaintenance();
    assert.equal(f.offers.length, 0);
    f.advanceBy(5_000);
    await f.runMaintenance();
    assert.equal(f.offers.length, 1);
    await f.runMaintenance();
    assert.equal(f.offers.length, 1);
    assert.equal(f.offers[0].name, "Primero");
  } finally {
    await f.close();
  }
});

test("reiniciar conserva orden, vencimientos y avisos pendientes", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "busco-waitlist-"));
  const filename = path.join(directory, "test.sqlite");
  let f = await fixture(filename);
  let restarted: Awaited<ReturnType<typeof createTestApplication>> | undefined;
  try {
    await f.queue(f.first);
    await f.queue(f.second);
    await f.cancelPlayer();
    const expires = Date.parse((await f.detail(f.first)).offer.expiresAt);
    const { base, second } = f;
    await f.close();
    restarted = await createTestApplication(filename);
    restarted.advanceTo(expires);
    await restarted.runMaintenance();
    const result = await restarted.request(base, "GET", undefined, second);
    assert.ok(result.body.offer);
    assert.equal(result.body.waitlistPosition, 1);
    assert.equal(restarted.offers.length, 1);
    assert.equal(restarted.offers[0].name, "Segundo");
  } finally {
    await f.close();
    await restarted?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("el temporizador vence ofertas y avisa al siguiente sin visitas a la API", async () => {
  const f = await fixture();
  try {
    await f.queue(f.first);
    await f.queue(f.second);
    await f.cancelPlayer();
    f.startBackgroundJobs();
    const until = async (count: number) => {
      const deadline = Date.now() + 2000;
      while (f.offers.length < count) {
        if (Date.now() > deadline)
          throw new Error("El proceso de fondo no envió el aviso.");
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    };
    await until(1);
    f.advanceBy(2 * 3_600_000);
    // No se realizan requests HTTP entre el cambio del reloj y la entrega.
    await until(2);
    assert.equal(f.offers[1].name, "Segundo");
  } finally {
    await f.close();
  }
});
