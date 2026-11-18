import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import type { MatchDetail, SessionPerson } from "@falta-uno/contracts";
import {
  SessionContext,
  type SessionContextValue,
} from "../src/features/session/SessionContext.ts";
import { useMatch } from "../src/features/matches/hooks/useMatch.ts";
import { useMyMatches } from "../src/features/matches/hooks/useMyMatches.ts";

type DetailState = ReturnType<typeof useMatch>;
type ListState = ReturnType<typeof useMyMatches>;
interface PendingRequest {
  method: string;
  signal?: AbortSignal | null;
  respond: (body: unknown, status?: number) => void;
  reject: (error: Error) => void;
}
const ana: SessionPerson = {
  id: "ana",
  name: "Ana",
  email: "ana@example.test",
};
const bruno: SessionPerson = {
  id: "bruno",
  name: "Bruno",
  email: "bruno@example.test",
};
const match: MatchDetail = {
  id: "partido",
  sport: "Pádel",
  title: "Pádel del viernes",
  startsAt: "2035-11-20T23:00:00Z",
  timeZone: "America/Montevideo",
  venue: "Club Centro",
  capacity: 4,
  confirmed: 1,
  reserved: 0,
  price: null,
  currency: "UYU",
  notes: "",
  organizer: ana,
  players: [ana],
  isOrganizer: false,
  joined: false,
  closed: false,
  waitingList: [],
  waitlistPosition: null,
  waitlistState: "none",
  offer: null,
};
let dom: JSDOM;
let root: Root;
let requests: PendingRequest[];
let detail: DetailState;
let list: ListState;
let renders: { personId: string | undefined; state: DetailState }[];

beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  root = createRoot(dom.window.document.getElementById("root")!);
  requests = [];
  renders = [];
  // A propósito, el doble HTTP ignora abort: también debemos descartar una
  // respuesta tardía cuando el transporte no logra detener la solicitud.
  mock.method(
    globalThis,
    "fetch",
    (_url: unknown, options?: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        requests.push({
          method: options?.method ?? "GET",
          signal: options?.signal,
          respond: (body, status = 200) =>
            resolve(Response.json(body, { status })),
          reject,
        });
      }),
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
  mock.restoreAll();
  dom.window.close();
});

function DetailProbe({ personId, id }: { personId?: string; id: string }) {
  detail = useMatch(id);
  renders.push({ personId, state: detail });
  return createElement("div", null, detail.match?.title ?? "Cargando");
}
function ListProbe({ personId }: { personId?: string }) {
  list = useMyMatches(personId);
  return createElement(
    "div",
    null,
    list.matches.map((item) => item.title).join(","),
  );
}
async function renderDetail(
  person: SessionPerson | null,
  id = match.id,
  strict = false,
) {
  const session: SessionContextValue = {
    person,
    ready: true,
    localMail: true,
    verify: async () => {
      throw new Error("No se verifica acceso en este test.");
    },
    logout: async () => {},
  };
  const tree = createElement(
    SessionContext.Provider,
    { value: session },
    createElement(DetailProbe, { personId: person?.id, id }),
  );
  await act(async () =>
    root.render(strict ? createElement(StrictMode, null, tree) : tree),
  );
}
async function renderList(personId?: string) {
  await act(async () => root.render(createElement(ListProbe, { personId })));
}
function currentDetail() {
  return detail;
}
function latestRequest() {
  return requests.at(-1)!;
}
async function respond(request: PendingRequest, body: unknown, status = 200) {
  await act(async () => request.respond(body, status));
}

test("detalle: ingresar y salir recarga sin esperar al intervalo ni mostrar datos de la identidad previa", async () => {
  await renderDetail(null);
  await respond(latestRequest(), match);
  await renderDetail(ana);
  assert.equal(currentDetail().match, null);
  assert.equal(detail.loading, true);
  await respond(latestRequest(), { ...match, isOrganizer: true, joined: true });
  assert.equal(detail.match?.isOrganizer, true);
  assert.equal(detail.match?.joined, true);

  await renderDetail(null);
  assert.equal(currentDetail().match, null);
  assert.equal(detail.loading, true);
  await respond(latestRequest(), match);
  assert.equal(detail.match?.isOrganizer, false);
  assert.equal(detail.match?.joined, false);
  const afterLogin = renders.findIndex((item) => item.personId === ana.id);
  const afterLogout = renders.findIndex(
    (item, index) => index > afterLogin && item.personId === undefined,
  );
  assert.ok(
    renders
      .slice(afterLogout)
      .every(
        (item) => !item.state.match?.joined && !item.state.match?.isOrganizer,
      ),
  );
});

test("detalle: cambiar de cuenta limpia la oferta y descarta consultas viejas, incluso al volver a la misma cuenta", async () => {
  await renderDetail(ana);
  const firstAna = latestRequest();
  const offer = { id: "oferta-ana", expiresAt: "2035-11-20T22:00:00Z" };
  await respond(firstAna, {
    ...match,
    offer,
    waitlistState: "offered",
    waitlistPosition: 1,
  });
  await act(async () => {
    window.dispatchEvent(new window.Event("focus"));
  });
  const oldRefresh = latestRequest();
  await renderDetail(bruno);
  const brunoRequest = latestRequest();
  assert.equal(oldRefresh.signal?.aborted, true);
  assert.equal(currentDetail().match, null);
  assert.ok(
    renders
      .filter((item) => item.personId === bruno.id)
      .every((item) => !item.state.match?.offer),
  );
  await respond(brunoRequest, match);
  await respond(oldRefresh, { ...match, offer });
  assert.equal(detail.match?.offer, null);

  await renderDetail(ana);
  const nextAna = latestRequest();
  await respond(nextAna, { ...match, joined: true });
  await respond(brunoRequest, match);
  assert.equal(detail.match?.joined, true);
});

test("detalle: una consulta de una sesión anterior no revive al volver a esa cuenta", async () => {
  await renderDetail(ana);
  const oldAna = latestRequest();
  await renderDetail(bruno);
  await renderDetail(ana);
  const newAna = latestRequest();
  assert.notEqual(newAna, oldAna);
  await respond(newAna, { ...match, joined: false });
  await respond(oldAna, { ...match, joined: true, isOrganizer: true });
  assert.equal(detail.match?.joined, false);
  assert.equal(detail.match?.isOrganizer, false);
});

for (const failure of [false, true]) {
  test(`detalle: una acción ${failure ? "fallida" : "exitosa"} de otra sesión no altera datos ni desbloquea una acción actual`, async () => {
    await renderDetail(ana);
    await respond(latestRequest(), match);
    let oldAction!: Promise<boolean>;
    await act(async () => {
      oldAction = detail.confirm();
    });
    const oldRequest = latestRequest();
    assert.equal(detail.pending, true);

    await renderDetail(bruno);
    assert.equal(detail.pending, false);
    assert.equal(detail.actionError, "");
    await respond(latestRequest(), match);
    let newAction!: Promise<boolean>;
    await act(async () => {
      newAction = detail.confirm();
    });
    const newRequest = latestRequest();
    await respond(
      oldRequest,
      failure
        ? { error: "Conflicto anterior", code: "FULL" }
        : { ...match, joined: true, isOrganizer: true },
      failure ? 409 : 200,
    );
    assert.equal(await oldAction, false);
    assert.equal(detail.match?.joined, false);
    assert.equal(detail.match?.isOrganizer, false);
    assert.equal(detail.actionError, "");
    assert.equal(detail.pending, true);
    assert.equal(latestRequest(), newRequest);
    await respond(newRequest, { ...match, joined: true });
    assert.equal(await newAction, true);
    assert.equal(detail.pending, false);
    assert.equal(detail.match?.joined, true);
  });
}

test("detalle: un reintento anterior no introduce errores ni termina la carga de la nueva sesión", async () => {
  await renderDetail(ana);
  await respond(latestRequest(), match);
  let reload!: Promise<void>;
  await act(async () => {
    reload = detail.reload();
  });
  const oldReload = latestRequest();
  await renderDetail(bruno);
  await act(async () => oldReload.reject(new TypeError("Sin conexión")));
  await reload;
  assert.equal(detail.error, "");
  assert.equal(detail.loading, true);
  await respond(latestRequest(), match);
  assert.equal(detail.loading, false);
});

test("detalle: un conflicto de la cuenta actual conserva el error y actualiza los cupos", async () => {
  await renderDetail(ana);
  await respond(latestRequest(), match);
  let action!: Promise<boolean>;
  await act(async () => {
    action = detail.confirm();
  });
  await respond(
    latestRequest(),
    { error: "El partido está completo", code: "FULL" },
    409,
  );
  assert.equal(latestRequest().method, "GET");
  await respond(latestRequest(), { ...match, confirmed: 4 });
  assert.equal(await action, false);
  assert.equal(detail.match?.confirmed, 4);
  assert.equal(detail.actionError, "El partido está completo");
  assert.equal(detail.pending, false);
});

test("detalle: cambiar de partido y montar con StrictMode descarta respuestas obsoletas", async () => {
  await renderDetail(ana, "primero", true);
  const old = latestRequest();
  assert.equal(requests[0].signal?.aborted, true);
  await renderDetail(ana, "segundo", true);
  const current = latestRequest();
  await respond(current, { ...match, id: "segundo" });
  await respond(old, { ...match, id: "primero" });
  assert.equal(detail.match?.id, "segundo");
});

test("mis partidos: cerrar sesión limpia datos y carga; una respuesta previa no restaura el listado", async () => {
  await renderList(ana.id);
  await respond(latestRequest(), [match]);
  assert.equal(list.matches.length, 1);
  await act(async () => list.reload());
  const old = latestRequest();
  await renderList();
  assert.equal(list.matches.length, 0);
  assert.equal(list.loading, false);
  assert.equal(list.error, "");
  assert.equal(old.signal?.aborted, true);
  await respond(old, [match]);
  assert.equal(list.matches.length, 0);
});

test("mis partidos: cambiar de cuenta vacía la lista y descarta errores de la anterior", async () => {
  await renderList(ana.id);
  await respond(latestRequest(), [match]);
  await act(async () => list.reload());
  const old = latestRequest();
  await renderList(bruno.id);
  assert.equal(list.matches.length, 0);
  assert.equal(list.loading, true);
  await act(async () => old.reject(new Error("Error de la cuenta anterior")));
  assert.equal(list.error, "");
  await respond(latestRequest(), [{ ...match, id: "partido-bruno" }]);
  assert.deepEqual(
    list.matches.map((item) => item.id),
    ["partido-bruno"],
  );
  assert.equal(list.loading, false);
});
