import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatLocalDateTime,
  zonedDateTimeToIso,
  editStartTime,
  priceToCents,
} from "@falta-uno/contracts";

test("edición convierte la hora del partido, conserva segundos si no cambia y permite otra zona", () => {
  const original = {
    startsAt: "2035-11-20T23:30:45.123Z",
    timeZone: "America/Montevideo",
  };
  assert.equal(
    formatLocalDateTime(original.startsAt, original.timeZone),
    "2035-11-20T20:30",
  );
  assert.equal(
    editStartTime("2035-11-20T20:30", original.timeZone, original),
    original.startsAt,
  );
  assert.equal(
    zonedDateTimeToIso("2035-11-20T20:30", "America/Montevideo"),
    "2035-11-20T23:30:00.000Z",
  );
  assert.equal(
    editStartTime("2035-11-20T20:30", "Europe/Madrid", original),
    "2035-11-20T19:30:00.000Z",
  );
});
test("edición rechaza fechas imposibles, zonas desconocidas y horas inexistentes o ambiguas por DST", () => {
  assert.throws(() =>
    zonedDateTimeToIso("2035-02-31T20:00", "America/Montevideo"),
  );
  assert.throws(() =>
    zonedDateTimeToIso("2035-11-20T25:00", "America/Montevideo"),
  );
  assert.throws(() =>
    zonedDateTimeToIso("2035-11-20T20:00", "Zona/Inexistente"),
  );
  assert.throws(
    () => zonedDateTimeToIso("2026-03-08T02:30", "America/New_York"),
    /no existe/,
  );
  assert.throws(
    () => zonedDateTimeToIso("2026-11-01T01:30", "America/New_York"),
    /ambigua/,
  );
});
test("costo compartido distingue pendiente, gratuito e importes con decimales", () => {
  assert.equal(priceToCents(""), null);
  assert.equal(priceToCents("0"), 0);
  assert.equal(priceToCents("350,50"), 35050);
  for (const value of ["-1", "1.234", "1e3", "abc"])
    assert.throws(() => priceToCents(value));
});
