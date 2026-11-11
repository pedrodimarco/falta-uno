import type { MatchSummary } from "@busco/contracts";

export function formatMatchDate(match: MatchSummary): string {
  return new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: match.timeZone,
  }).format(new Date(match.startsAt));
}

export function formatMatchPrice(match: MatchSummary): string {
  if (match.price === null) return "Costo a confirmar";
  if (match.price === 0) return "Sin costo";

  const amount = new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: match.currency,
    maximumFractionDigits: 2,
  }).format(match.price / 100);

  return `${amount} por persona`;
}
