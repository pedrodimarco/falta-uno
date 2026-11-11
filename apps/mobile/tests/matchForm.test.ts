import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMatchInput,
  type MatchDraft,
} from "../src/features/matches/matchForm.ts";
const draft: MatchDraft = {
  sport: "Pádel",
  title: "Pádel del jueves",
  date: "2035-11-20",
  time: "20:30",
  venue: "Club Centro",
  capacity: "4",
  price: "350,50",
  notes: "",
  organizerPlays: true,
};
test("formulario móvil convierte hora local a UTC y costo a centésimos", () => {
  const result = buildMatchInput(draft, 0);
  assert.equal(result.price, 35050);
  assert.equal(result.capacity, 4);
  assert.equal(new Date(result.startsAt).getHours(), 20);
  assert.equal(new Date(result.startsAt).getMinutes(), 30);
  assert.equal(
    result.timeZone,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  assert.equal(buildMatchInput({ ...draft, price: "" }, 0).price, null);
  assert.equal(buildMatchInput({ ...draft, price: "0" }, 0).price, 0);
});
test("formulario rechaza fechas inexistentes, pasadas, horas, montos y cupos inválidos", () => {
  for (const changes of [
    { date: "2035-02-31" },
    { time: "25:00" },
    { date: "2020-01-01" },
    { price: "-1" },
    { price: "2.555" },
    { price: "1e3" },
    { capacity: "4.5" },
    { capacity: "51" },
  ])
    assert.throws(() => buildMatchInput({ ...draft, ...changes }));
});
