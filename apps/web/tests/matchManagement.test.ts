import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import type { MatchDetail, UpdateMatchInput } from "@falta-uno/contracts";
import { MatchManagement } from "../src/features/matches/components/MatchManagement.tsx";

const original: MatchDetail = {
  id: "match",
  version: 1,
  sport: "Pádel",
  title: "Pádel del viernes",
  startsAt: "2035-11-20T23:00:00Z",
  timeZone: "America/Montevideo",
  venue: "Club Centro",
  capacity: 4,
  confirmed: 1,
  reserved: 0,
  price: 35050,
  currency: "UYU",
  notes: "Pelota",
  organizer: { id: "ana", name: "Ana" },
  players: [{ id: "ana", name: "Ana" }],
  isOrganizer: true,
  joined: true,
  closed: false,
  waitingList: [],
  waitlistPosition: null,
  waitlistState: "none",
  offer: null,
};
let dom: JSDOM, root: Root, saved: UpdateMatchInput[];
let previousFormData: typeof FormData;
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" });
  previousFormData = globalThis.FormData;
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    FormData: dom.window.FormData,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  root = createRoot(document.getElementById("root")!);
  saved = [];
});
afterEach(async () => {
  await act(async () => root.unmount());
  globalThis.FormData = previousFormData;
  dom.window.close();
});
async function render(match = original) {
  await act(async () =>
    root.render(
      createElement(MatchManagement, {
        match,
        pending: false,
        error: "",
        onUpdate: async (input) => {
          saved.push(input);
          return true;
        },
        onAdd: async () => true,
        onRemove: async () => true,
      }),
    ),
  );
}
function button(text: string) {
  return [...document.querySelectorAll("button")].find(
    (button) => button.textContent === text,
  )!;
}
function input(name: string) {
  return document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
}

test("el panel de gestión se muestra solo al organizador y deja de ofrecer acciones después del inicio", async () => {
  await render({ ...original, isOrganizer: false });
  assert.equal(document.querySelector("section"), null);
  await render();
  assert.ok(button("Editar datos"));
  await render({ ...original, closed: true });
  assert.equal(document.querySelectorAll("button").length, 0);
  assert.match(document.body.textContent!, /ya comenzó/);
});
test("guardar edición conserva zona horaria y centésimos y envía la versión que se abrió", async () => {
  await render();
  await act(async () => button("Editar datos").click());
  assert.equal(input("startsAt").value, "2035-11-20T20:00");
  assert.equal(input("price").value, "350.5");
  input("title").value = "Pádel actualizado";
  await act(async () =>
    document
      .querySelector("form")!
      .dispatchEvent(
        new dom.window.Event("submit", { bubbles: true, cancelable: true }),
      ),
  );
  assert.equal(saved.length, 1);
  assert.equal(saved[0].title, "Pádel actualizado");
  assert.equal(saved[0].price, 35050);
  assert.equal(saved[0].startsAt, original.startsAt);
  assert.equal(saved[0].expectedVersion, 1);
  assert.ok(button("Editar datos"));
});
test("un refresco no pisa el borrador; cargar la última versión es una acción explícita", async () => {
  await render();
  await act(async () => button("Editar datos").click());
  input("title").value = "Mi borrador";
  await render({ ...original, title: "Cambio en otra pantalla", version: 2 });
  assert.equal(input("title").value, "Mi borrador");
  assert.ok(button("Cargar la última versión"));
  await act(async () => button("Cargar la última versión").click());
  assert.equal(input("title").value, "Cambio en otra pantalla");
  await act(async () =>
    document
      .querySelector("form")!
      .dispatchEvent(
        new dom.window.Event("submit", { bubbles: true, cancelable: true }),
      ),
  );
  assert.equal(saved[0].expectedVersion, 2);
});
