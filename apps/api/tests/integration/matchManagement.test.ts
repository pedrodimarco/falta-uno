import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { MatchDetail, Person } from "@falta-uno/contracts";
import { createTestApplication } from "../helpers/createTestApplication.ts";

async function fixture(filename = ":memory:", capacity = 4) {
  const f = await createTestApplication(filename);
  try {
    const organizer = await f.person("Organizador", "organizer@example.test");
    const player = await f.person("Jugador", "player@example.test");
    const first = await f.person("Primero", "first@example.test");
    const second = await f.person("Segundo", "second@example.test");
    const created = await f.request(
      "/api/matches",
      "POST",
      {
        sport: "Pádel",
        title: "Partido administrado",
        startsAt: new Date(f.now() + 8 * 3_600_000).toISOString(),
        timeZone: "America/Montevideo",
        venue: "Cancha Centro",
        capacity,
        price: null,
        currency: "UYU",
        notes: "",
        organizerPlays: true,
      },
      organizer,
    );
    assert.equal(created.status, 201);
    const match = created.body as MatchDetail;
    const base = `/api/matches/${match.id}`;
    const playerId = (await f.request("/api/session", "GET", undefined, player))
      .body.person.id as string;
    const detail = async (cookie = organizer): Promise<MatchDetail> =>
      (await f.request(base, "GET", undefined, cookie)).body;
    const update = (
      changes = {},
      version = match.version,
      cookie = organizer,
    ) =>
      f.request(
        base,
        "PATCH",
        { ...editable(match), ...changes, expectedVersion: version },
        cookie,
      );
    const add = (email: string, cookie = organizer) =>
      f.request(
        `${base}/players`,
        "POST",
        { kind: "registered", email },
        cookie,
      );
    const queue = (cookie: string) =>
      f.request(`${base}/waitlist`, "PUT", undefined, cookie);
    return {
      ...f,
      organizer,
      player,
      first,
      second,
      playerId,
      match,
      base,
      detail,
      update,
      add,
      queue,
    };
  } catch (error) {
    await f.close();
    throw error;
  }
}
function editable(match: MatchDetail) {
  const {
    sport,
    title,
    startsAt,
    timeZone,
    venue,
    capacity,
    price,
    currency,
    notes,
  } = match;
  return {
    sport,
    title,
    startsAt,
    timeZone,
    venue,
    capacity,
    price,
    currency,
    notes,
  };
}

test("solo el organizador edita; todos los datos mutables se guardan sin alterar identidad ni participantes", async () => {
  const f = await fixture();
  try {
    const changes = {
      sport: "Básquet",
      title: "Básquet del sábado",
      venue: "Club Nuevo",
      startsAt: new Date(f.now() + 10 * 3_600_000).toISOString(),
      timeZone: "America/Argentina/Buenos_Aires",
      capacity: 10,
      price: 35050,
      notes: "Llevar pelota",
    };
    assert.equal((await f.update(changes, 1, f.player)).status, 403);
    assert.equal(
      (
        await f.request(f.base, "PATCH", {
          ...editable(f.match),
          expectedVersion: 1,
        })
      ).status,
      401,
    );
    const result = await f.update(changes);
    assert.equal(result.status, 200);
    for (const [key, value] of Object.entries(changes))
      assert.equal(result.body[key], value);
    assert.equal(result.body.version, 2);
    assert.equal(result.body.id, f.match.id);
    assert.deepEqual(result.body.organizer, f.match.organizer);
    assert.deepEqual(result.body.players, f.match.players);
    assert.equal((await f.request(f.base)).body.venue, changes.venue);
    assert.equal((await f.request(f.base)).body.organizer.email, undefined);
  } finally {
    await f.close();
  }
});

test("edición concurrente: una versión gana y la otra recibe conflicto; no se pueden modificar campos de propiedad", async () => {
  const f = await fixture();
  try {
    const results = await Promise.all([
      f.update({ title: "Primera edición" }),
      f.update({ title: "Segunda edición" }),
    ]);
    assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
    assert.equal(
      results.find((result) => result.status === 409)!.body.code,
      "STALE_MATCH",
    );
    assert.equal((await f.detail()).version, 2);
    assert.equal((await f.update({ organizerId: f.playerId }, 2)).status, 422);
    assert.equal((await f.update({ organizerPlays: false }, 2)).status, 422);
    assert.equal(
      (await f.update({ startsAt: new Date(f.now() - 1).toISOString() }, 2))
        .status,
      422,
    );
    assert.equal(
      (await f.update({ timeZone: "Zona/Inexistente" }, 2)).status,
      422,
    );
  } finally {
    await f.close();
  }
});

test("alta de usuarios e invitados: permisos, privacidad, reintentos y alcance del invitado", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.add("player@example.test", f.player)).status, 403);
    assert.equal((await f.add("inexistente@example.test")).status, 404);
    assert.equal((await f.add("PLAYER@example.test")).status, 200);
    assert.equal((await f.add("player@example.test")).body.confirmed, 2);
    const guest = {
      kind: "guest",
      name: "Invitado de prueba",
      guestId: randomUUID(),
    };
    const added = await f.request(
      `${f.base}/players`,
      "POST",
      guest,
      f.organizer,
    );
    assert.equal(added.status, 200);
    assert.equal(added.body.confirmed, 3);
    assert.equal(
      added.body.players.find((p: Person) => p.id === guest.guestId).isGuest,
      true,
    );
    assert.equal(
      (await f.request(`${f.base}/players`, "POST", guest, f.organizer)).body
        .confirmed,
      3,
    );
    assert.equal(
      (
        await f.request(
          `${f.base}/players`,
          "POST",
          { ...guest, name: "Otro nombre" },
          f.organizer,
        )
      ).status,
      409,
    );
    assert.ok((await f.detail(f.player)).players.every((p) => !("email" in p)));
    const other = await f.request(
      "/api/matches",
      "POST",
      { ...editable(f.match), organizerPlays: false },
      f.organizer,
    );
    assert.equal(
      (
        await f.request(
          `/api/matches/${other.body.id}/players`,
          "POST",
          guest,
          f.organizer,
        )
      ).status,
      409,
    );
  } finally {
    await f.close();
  }
});

test("las altas del organizador no saltan la espera ni ocupan reservas ajenas; puede confirmar una oferta asignada", async () => {
  const f = await fixture(":memory:", 2);
  try {
    await f.add("player@example.test");
    assert.equal((await f.queue(f.first)).status, 200);
    assert.equal((await f.queue(f.second)).status, 200);
    assert.equal(
      (
        await f.request(
          `${f.base}/players/${f.playerId}`,
          "DELETE",
          undefined,
          f.organizer,
        )
      ).status,
      200,
    );
    assert.equal((await f.add("second@example.test")).status, 409);
    assert.equal(
      (
        await f.request(
          `${f.base}/players`,
          "POST",
          { kind: "guest", name: "Sin adelantar", guestId: randomUUID() },
          f.organizer,
        )
      ).status,
      409,
    );
    const before = await f.detail(f.first);
    assert.equal(before.reserved, 1);
    assert.ok(before.offer);
    assert.equal((await f.add("first@example.test")).body.confirmed, 2);
    const after = await f.detail(f.second);
    assert.equal(after.waitlistPosition, 1);
    assert.equal(after.offer, null);
    assert.equal((await f.detail(f.first)).waitlistState, "accepted");
  } finally {
    await f.close();
  }
});

test("quitar confirmados y personas en espera mantiene orden y libera cada lugar una sola vez", async () => {
  const f = await fixture(":memory:", 2);
  try {
    await f.add("player@example.test");
    await f.queue(f.first);
    await f.queue(f.second);
    assert.equal(
      (
        await f.request(
          `${f.base}/players/${f.playerId}`,
          "DELETE",
          undefined,
          f.player,
        )
      ).status,
      403,
    );
    const firstId = (await f.detail()).waitingList[0].person.id;
    const secondId = (await f.detail()).waitingList[1].person.id;
    await f.request(
      `${f.base}/players/${f.playerId}`,
      "DELETE",
      undefined,
      f.organizer,
    );
    const duplicate = await f.request(
      `${f.base}/players/${f.playerId}`,
      "DELETE",
      undefined,
      f.organizer,
    );
    assert.equal(duplicate.body.reserved, 1);
    const removed = await f.request(
      `${f.base}/players/${firstId}`,
      "DELETE",
      undefined,
      f.organizer,
    );
    assert.deepEqual(
      removed.body.waitingList.map(
        (entry: { person: Person }) => entry.person.id,
      ),
      [secondId],
    );
    assert.ok((await f.detail(f.second)).offer);
  } finally {
    await f.close();
  }
});

test("capacidad: no se reducen cupos confirmados o reservados; ampliarla ofrece lugares por orden", async () => {
  const f = await fixture(":memory:", 2);
  try {
    await f.add("player@example.test");
    await f.queue(f.first);
    await f.queue(f.second);
    const expanded = await f.update({ capacity: 3 });
    assert.equal(expanded.status, 200);
    assert.equal(expanded.body.reserved, 1);
    const rejected = await f.update({ capacity: 2 }, 2);
    assert.equal(rejected.status, 409);
    assert.equal(rejected.body.code, "CAPACITY_TOO_SMALL");
    assert.equal((await f.detail()).version, 2);
    assert.equal((await f.detail()).capacity, 3);
    assert.ok((await f.detail(f.first)).offer);
    assert.equal((await f.detail(f.second)).offer, null);
  } finally {
    await f.close();
  }
});

test("adelantar el horario acorta una oferta sin cambiar su ID ni el orden; postergar no la extiende", async () => {
  const f = await fixture(":memory:", 2);
  try {
    await f.add("player@example.test");
    await f.queue(f.first);
    await f.queue(f.second);
    await f.request(
      `${f.base}/players/${f.playerId}`,
      "DELETE",
      undefined,
      f.organizer,
    );
    const oldOffer = (await f.detail(f.first)).offer!;
    assert.equal(Date.parse(oldOffer.expiresAt), f.now() + 30 * 60_000);
    const earlier = new Date(f.now() + 10 * 60_000).toISOString();
    assert.equal((await f.update({ startsAt: earlier })).status, 200);
    const shortOffer = (await f.detail(f.first)).offer!;
    assert.equal(shortOffer.id, oldOffer.id);
    assert.equal(shortOffer.expiresAt, earlier);
    assert.equal(
      (
        await f.update(
          { startsAt: new Date(f.now() + 2 * 3_600_000).toISOString() },
          2,
        )
      ).status,
      200,
    );
    assert.equal((await f.detail(f.first)).offer!.expiresAt, earlier);
    f.advanceBy(10 * 60_000);
    await f.runMaintenance();
    assert.ok((await f.detail(f.second)).offer);
  } finally {
    await f.close();
  }
});

test("cancelación propia hasta una hora inclusive; el organizador gestiona hasta el inicio y luego se cierra", async () => {
  const f = await fixture();
  try {
    await f.add("player@example.test");
    const start = Date.parse(f.match.startsAt);
    f.advanceTo(start - 3_600_000);
    assert.equal(
      (
        await f.request(
          `${f.base}/participation`,
          "DELETE",
          undefined,
          f.player,
        )
      ).status,
      200,
    );
    await f.add("player@example.test");
    f.advanceBy(1);
    const rejected = await f.request(
      `${f.base}/participation`,
      "DELETE",
      undefined,
      f.player,
    );
    assert.equal(rejected.status, 409);
    assert.equal(rejected.body.code, "CANCELLATION_CLOSED");
    assert.equal((await f.detail(f.player)).canCancelParticipation, false);
    assert.equal(
      (
        await f.request(
          `${f.base}/players/${f.playerId}`,
          "DELETE",
          undefined,
          f.organizer,
        )
      ).status,
      200,
    );
    f.advanceTo(start);
    assert.equal((await f.update()).body.code, "CLOSED");
    assert.equal((await f.add("player@example.test")).body.code, "CLOSED");
    assert.equal(
      (
        await f.request(
          `${f.base}/players/${f.playerId}`,
          "DELETE",
          undefined,
          f.organizer,
        )
      ).body.code,
      "CLOSED",
    );
  } finally {
    await f.close();
  }
});

test("reiniciar conserva edición, versión e invitados sin duplicar migraciones", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "falta-management-"));
  let f: Awaited<ReturnType<typeof fixture>> | undefined;
  let restored: Awaited<ReturnType<typeof createTestApplication>> | undefined;
  try {
    const filename = path.join(dir, "test.sqlite");
    f = await fixture(filename);
    const guestId = randomUUID();
    await f.request(
      `${f.base}/players`,
      "POST",
      { kind: "guest", name: "Invitado persistido", guestId },
      f.organizer,
    );
    await f.update({ venue: "Cancha actualizada" });
    const id = f.match.id;
    await f.close();
    restored = await createTestApplication(filename);
    const match = (await restored.request(`/api/matches/${id}`)).body;
    assert.equal(match.version, 2);
    assert.equal(match.venue, "Cancha actualizada");
    assert.equal(
      match.players.find((p: Person) => p.id === guestId).isGuest,
      true,
    );
  } finally {
    await restored?.close();
    await f?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
