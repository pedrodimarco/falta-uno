export const OFFER_TTL_MS = 30 * 60_000;
export function offerDeadline(now: Date, startsAt: string): number {
  return Math.min(now.getTime() + OFFER_TTL_MS, Date.parse(startsAt));
}
