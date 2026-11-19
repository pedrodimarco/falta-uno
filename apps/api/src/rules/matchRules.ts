import { DomainError } from "../errors/DomainError.ts";
import type { Match } from "../models/Match.ts";

export function isMatchClosed(startsAt: string, now: Date): boolean {
  return Date.parse(startsAt) <= now.getTime();
}

export function assertFutureStart(startsAt: string, now: Date): void {
  if (isMatchClosed(startsAt, now)) {
    throw new DomainError("PAST_DATE", "Elegí una fecha y hora futuras.");
  }
}

export function assertParticipationOpen(
  match: Match,
  now: Date,
  action: "join" | "leave",
): void {
  if (!isMatchClosed(match.startsAt, now)) return;
  const message =
    action === "join"
      ? "El partido ya comenzó. Las inscripciones están cerradas."
      : "El partido ya comenzó. No podés cambiar tu asistencia.";
  throw new DomainError("CLOSED", message);
}

export const PARTICIPATION_CANCELLATION_NOTICE_MS = 60 * 60_000;
export function cancellationDeadline(startsAt: string): number {
  return Date.parse(startsAt) - PARTICIPATION_CANCELLATION_NOTICE_MS;
}
export function assertCancellationOpen(match: Match, now: Date): void {
  if (now.getTime() > cancellationDeadline(match.startsAt))
    throw new DomainError(
      "CANCELLATION_CLOSED",
      "Podés cancelar tu participación hasta una hora antes del encuentro. Contactá al organizador.",
    );
}
export function assertOrganizer(match: Match, personId: string): void {
  if (match.organizer.id !== personId)
    throw new DomainError(
      "FORBIDDEN",
      "Solo el organizador puede administrar este partido.",
    );
}

export function assertAvailableCapacity(match: Match, reserved = 0): void {
  if (match.players.length + reserved >= match.capacity) {
    throw new DomainError(
      "FULL",
      "Se completaron los cupos disponibles. Podés anotarte en la lista de espera.",
    );
  }
}
