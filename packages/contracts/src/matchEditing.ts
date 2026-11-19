/** Conversiones puras que comparten los formularios web y nativo. */
export function formatLocalDateTime(instant: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function zonedDateTimeToIso(value: string, timeZone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Ingresá una fecha y hora válidas.");
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  if (year < 1000 || new Date(wall).toISOString().slice(0, 16) !== value)
    throw new Error("La fecha y hora no existen.");
  const offsets = new Set<number>();
  for (let hours = -24; hours <= 24; hours += 6) {
    const sample = wall + hours * 3_600_000;
    const local = formatLocalDateTime(new Date(sample).toISOString(), timeZone);
    offsets.add(Date.parse(`${local}:00Z`) - sample);
  }
  const candidates = [...offsets]
    .map((offset) => new Date(wall - offset).toISOString())
    .filter((instant) => formatLocalDateTime(instant, timeZone) === value);
  if (candidates.length === 0)
    throw new Error(
      "Esa hora no existe en la zona indicada por un cambio de horario.",
    );
  if (candidates.length > 1)
    throw new Error(
      "Esa hora es ambigua por un cambio de horario. Elegí otra hora.",
    );
  return candidates[0];
}
export function editStartTime(
  value: string,
  timeZone: string,
  original: { startsAt: string; timeZone: string },
): string {
  return timeZone === original.timeZone &&
    value === formatLocalDateTime(original.startsAt, original.timeZone)
    ? original.startsAt
    : zonedDateTimeToIso(value, timeZone);
}
export function priceToCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized))
    throw new Error("Ingresá un costo positivo con hasta dos decimales.");
  return Math.round(Number(normalized) * 100);
}
