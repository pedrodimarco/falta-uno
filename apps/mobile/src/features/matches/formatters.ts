import type { MatchSummary } from "@busco/contracts";
export function formatDate(match: MatchSummary) {
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
export function formatPrice(match: MatchSummary) {
  if (match.price === null) return "Costo a confirmar";
  if (match.price === 0) return "Sin costo";
  return `${new Intl.NumberFormat("es-UY", { style: "currency", currency: match.currency }).format(match.price / 100)} por persona`;
}
