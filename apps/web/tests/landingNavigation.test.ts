import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { act, createElement, useState } from "react";
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
  mock.restoreAll();
  dom.window.close();
});
function SessionRoutes() {
  const [person, setPerson] = useState(session.person);
  return createElement(
    SessionContext.Provider,
    {
      value: {
        ...session,
        person,
        verify: async (token: string) => {
          const result = await session.verify(token);
          setPerson(result.person);
          return result;
        },
        logout: async () => {
          await session.logout();
          setPerson(null);
        },
      },
    },
    createElement(AppRoutes),
  );
}
async function render(path = "/") {
  await act(async () =>
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(SessionRoutes),
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

for (const authenticated of [false, true]) {
  test(`la landing anuncia el desarrollo sin enlaces a funcionalidades (sesión: ${authenticated})`, async () => {
    if (authenticated)
      session.person = { id: "ana", name: "Ana", email: "ana@example.test" };
    await render();
    assert.ok(document.querySelector(".development-badge"));
    assert.match(
      document.querySelector(".hero-note")!.textContent!,
      /acceso público todavía no está disponible/,
    );
    const links = [...document.querySelectorAll("a")];
    assert.ok(links.some((a) => a.textContent === "Próximamente"));
    for (const action of links) {
      const destination = new URL(action.href);
      assert.equal(destination.pathname, "/");
      if (destination.hash)
        assert.ok(document.getElementById(destination.hash.slice(1)));
    }
  });
}

test("Login sigue accesible directamente y comunica que es para pruebas sin ofrecer navegación a partidos", async () => {
  await render("/ingresar?volver=%2Fpartidos%2Fnuevo");
  assert.equal(document.querySelector("h1")!.textContent, "Acceso de prueba.");
  assert.ok(document.querySelector('.login-form input[type="email"]'));
  assert.ok(link("Volver al inicio"));
  assert.equal(document.querySelector('a[href^="/partidos"]'), null);
});

for (const path of [
  "/partidos",
  "/partidos/nuevo",
  "/partidos/00000000-0000-4000-8000-000000000001",
]) {
  test(`sin sesión no se monta la funcionalidad en ${path}`, async () => {
    const fetch = mock.method(globalThis, "fetch", async () => {
      throw new Error("No debe consultar partidos sin sesión");
    });
    await render(path);
    assert.ok(document.querySelector(".landing-page"));
    assert.equal(document.querySelector(".login-form"), null);
    assert.equal(fetch.mock.callCount(), 0);
  });
}

test("la sesión anterior sin correo verificado tampoco accede a funcionalidades", async () => {
  session.person = { id: "legacy", name: "Anterior", email: null };
  await render("/partidos/nuevo");
  assert.ok(document.querySelector(".landing-page"));
});

test("las rutas privadas esperan la sesión antes de decidir la navegación", async () => {
  session.ready = false;
  session.person = { id: "ana", name: "Ana", email: "ana@example.test" };
  await render("/partidos/nuevo");
  assert.equal(document.querySelector("h1"), null);
  assert.equal(document.querySelector(".landing-page"), null);
  assert.match(
    document.querySelector('[role="status"]')!.textContent!,
    /Cargando/,
  );
  session.ready = true;
  await render("/partidos/nuevo");
  assert.equal(document.querySelector("h1")!.textContent, "Armá el partido.");
});

test("una sesión verificada puede usar el acceso directo para crear partidos", async () => {
  session.person = { id: "ana", name: "Ana", email: "ana@example.test" };
  await render("/ingresar?volver=%2Fpartidos%2Fnuevo");
  assert.equal(document.querySelector("h1")!.textContent, "Armá el partido.");
  assert.equal(document.querySelector(".trial-access-notice"), null);
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
  mock.method(globalThis, "fetch", async () => Response.json([]));
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

test("cerrar sesión desde una funcionalidad vuelve a la landing pública", async () => {
  session.person = { id: "ana", name: "Ana", email: "ana@example.test" };
  await render("/partidos/nuevo");
  assert.equal(document.querySelector("h1")!.textContent, "Armá el partido.");
  await act(async () =>
    [...document.querySelectorAll("button")]
      .find((b) => b.textContent === "Cerrar sesión")!
      .click(),
  );
  assert.ok(document.querySelector(".landing-page"));
  assert.equal(document.querySelector('a[href="/ingresar"]'), null);
});
