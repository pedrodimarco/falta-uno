import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { JSDOM } from "jsdom";
import { AppRoutes } from "../src/app/AppRoutes.tsx";
import {
  SessionContext,
  type SessionContextValue,
} from "../src/features/session/SessionContext.ts";

let dom: JSDOM;
let root: Root;
let session: SessionContextValue;
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  root = createRoot(document.getElementById("root")!);
  session = {
    person: null,
    ready: true,
    localMail: true,
    logout: async () => {},
    verify: async () => {
      throw new Error("Unexpected verification");
    },
  };
});
afterEach(async () => {
  await act(async () => root.unmount());
  dom.window.close();
});
async function render(path = "/") {
  await act(async () =>
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(
          SessionContext.Provider,
          { value: session },
          createElement(AppRoutes),
        ),
      ),
    ),
  );
}
function button(id: string) {
  return document.getElementById(id) as HTMLButtonElement;
}
function link(text: string) {
  return [...document.querySelectorAll("a")].find(
    (a) => a.textContent === text,
  )!;
}

test("la raíz muestra la landing incluso con sesión, y la demostración permite confirmar y liberar sin navegar", async () => {
  session.person = { id: "ana", name: "Ana", email: "ana@example.test" };
  await render();
  assert.match(document.querySelector("h1")!.textContent!, /Menos mensajes/);
  assert.equal(document.querySelector(".site-header"), null);
  await act(async () => button("attendance-button").click());
  assert.equal(
    document
      .querySelector('[role="progressbar"]')!
      .getAttribute("aria-valuenow"),
    "9",
  );
  assert.match(
    document.querySelector('[role="status"]')!.textContent!,
    /confirmado/,
  );
  await act(async () => button("attendance-button").click());
  assert.equal(
    document
      .querySelector('[role="progressbar"]')!
      .getAttribute("aria-valuenow"),
    "8",
  );
});

test("entrar abre el acceso y organizar conserva el destino de creación", async () => {
  await render();
  assert.equal(
    link("Organizar un partido").getAttribute("href"),
    "/ingresar?volver=%2Fpartidos%2Fnuevo",
  );
  for (const action of document.querySelectorAll<HTMLAnchorElement>(
    'a[href^="/ingresar"]',
  )) {
    assert.equal(new URL(action.href).pathname, "/ingresar");
  }
  assert.equal(
    document.querySelectorAll('a[href="/partidos/nuevo"]').length,
    0,
  );
  await act(async () => link("Entrar").click());
  assert.ok(document.querySelector('input[type="email"]'));
  assert.equal(link("Mis partidos").getAttribute("href"), "/partidos");
});

test("el menú móvil cierra con Escape y devuelve el foco al botón", async () => {
  await render();
  await act(async () => button("menu-toggle").click());
  assert.equal(button("menu-toggle").getAttribute("aria-expanded"), "true");
  await act(async () =>
    document.getElementById("landing-nav")!.dispatchEvent(
      new dom.window.KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    ),
  );
  assert.equal(button("menu-toggle").getAttribute("aria-expanded"), "false");
  assert.equal(document.activeElement, button("menu-toggle"));
});

test("los enlaces de acceso existentes con destino raíz vuelven a la agenda", async () => {
  const person = { id: "ana", name: "Ana", email: "ana@example.test" };
  session.verify = async () => ({ person, returnTo: "/" });
  // Keep the agenda anonymous so this routing test does not request match data.
  dom.window.history.replaceState(null, "", "/acceso#token=" + "a".repeat(64));
  await render("/acceso");
  await act(async () =>
    [...document.querySelectorAll("button")]
      .find((b) => b.textContent === "Confirmar acceso")!
      .click(),
  );
  assert.match(
    document.querySelector("h1")!.textContent!,
    /El próximo partido/,
  );
  assert.ok(link("Mis partidos"));
});

test("el acceso solicitado desde creación conserva ese destino", async () => {
  const person = { id: "ana", name: "Ana", email: "ana@example.test" };
  session.verify = async () => ({ person, returnTo: "/partidos/nuevo" });
  dom.window.history.replaceState(null, "", "/acceso#token=" + "b".repeat(64));
  await render("/acceso");
  await act(async () =>
    [...document.querySelectorAll("button")]
      .find((b) => b.textContent === "Confirmar acceso")!
      .click(),
  );
  assert.equal(document.querySelector("h1")!.textContent, "Armá el partido.");
});

test("organizar desde la landing abre Login antes del formulario", async () => {
  await render();
  const organizeLinks = [...document.querySelectorAll("a")].filter(
    (a) => a.textContent === "Organizar un partido",
  );
  assert.equal(organizeLinks.length, 3);
  for (const action of organizeLinks) {
    const destination = new URL(action.href);
    assert.equal(destination.pathname, "/ingresar");
    assert.equal(destination.searchParams.get("volver"), "/partidos/nuevo");
  }
  await act(async () => link("Organizar un partido").click());
  assert.ok(document.querySelector('input[type="email"]'));
  assert.equal(document.querySelector("h1"), null);
});

test("contacto valida los campos y conserva el mensaje sin enviarlo", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => {
    throw new Error("El contacto no debe enviar solicitudes");
  });
  try {
    await render();
    const form = document.querySelector<HTMLFormElement>(
      'form[aria-label="Contacto"]',
    )!;
    const name = form.elements.namedItem("name") as HTMLInputElement;
    const email = form.elements.namedItem("email") as HTMLInputElement;
    const message = form.elements.namedItem("message") as HTMLTextAreaElement;
    const submit = form.querySelector("button")!;
    assert.equal(form.checkValidity(), false);
    await act(async () => submit.click());
    assert.equal(form.querySelector('[role="status"]')!.textContent, "");
    name.value = "Ana";
    email.value = "correo-invalido";
    message.value = "Me gustaría conocer más sobre Falta uno.";
    assert.equal(form.checkValidity(), false);
    email.value = "ana@example.test";
    assert.equal(form.checkValidity(), true);
    await act(async () => submit.click());
    assert.match(
      form.querySelector('[role="status"]')!.textContent!,
      /no se envió/,
    );
    assert.equal(message.value, "Me gustaría conocer más sobre Falta uno.");
    assert.equal(name.value, "Ana");
    assert.equal(email.value, "ana@example.test");
    assert.equal(fetch.mock.callCount(), 0);
  } finally {
    fetch.mock.restore();
  }
});
