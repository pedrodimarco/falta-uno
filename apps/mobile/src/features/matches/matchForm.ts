import { matchInput, type MatchInput } from "@falta-uno/contracts";
export interface MatchDraft {
  sport: MatchInput["sport"];
  title: string;
  date: string;
  time: string;
  venue: string;
  capacity: string;
  price: string;
  notes: string;
  organizerPlays: boolean;
}
export function buildMatchInput(
  draft: MatchDraft,
  now = Date.now(),
): MatchInput {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(draft.date);
  const time = /^(\d{2}):(\d{2})$/.exec(draft.time);
  if (!date || !time) throw new Error("Usá fecha AAAA-MM-DD y hora HH:mm.");
  const [year, month, day, hour, minute] = [
    Number(date[1]),
    Number(date[2]),
    Number(date[3]),
    Number(time[1]),
    Number(time[2]),
  ];
  const starts = new Date(year, month - 1, day, hour, minute);
  if (
    starts.getFullYear() !== year ||
    starts.getMonth() !== month - 1 ||
    starts.getDate() !== day ||
    starts.getHours() !== hour ||
    starts.getMinutes() !== minute ||
    starts.getTime() <= now
  )
    throw new Error("Elegí una fecha y hora futuras válidas.");
  const price = draft.price.trim().replace(",", ".");
  if (price && !/^\d+(\.\d{1,2})?$/.test(price))
    throw new Error("El costo debe tener hasta dos decimales.");
  if (!/^\d+$/.test(draft.capacity))
    throw new Error("Ingresá una cantidad entera de cupos.");
  const result = matchInput.safeParse({
    ...draft,
    startsAt: starts.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    capacity: Number(draft.capacity),
    price: price ? Math.round(Number(price) * 100) : null,
    currency: "UYU",
  });
  if (!result.success)
    throw new Error(
      "Revisá el título (3 a 100 caracteres), lugar, cupos (2 a 50), costo y notas.",
    );
  return result.data;
}
