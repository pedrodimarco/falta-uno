import type { MatchInput } from "@falta-uno/contracts";

type MatchFormOptions = Pick<MatchInput, "sport" | "capacity" | "timeZone">;

/** Convierte valores del formulario al contrato de la API (UTC y centésimos). */
export function buildMatchInput(
  form: FormData,
  options: MatchFormOptions,
): MatchInput {
  const date = new Date(String(form.get("startsAt")));
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
    throw new Error("Elegí una fecha y hora futuras.");
  }
  const rawPrice = String(form.get("price"));
  return {
    ...options,
    title: String(form.get("title")),
    startsAt: date.toISOString(),
    venue: String(form.get("venue")),
    price: rawPrice === "" ? null : Math.round(Number(rawPrice) * 100),
    currency: "UYU",
    notes: String(form.get("notes")),
    organizerPlays: form.get("organizerPlays") === "on",
  };
}
