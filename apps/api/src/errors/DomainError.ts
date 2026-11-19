export type DomainErrorCode =
  | "NOT_FOUND"
  | "PAST_DATE"
  | "CLOSED"
  | "FULL"
  | "OFFER_REQUIRED"
  | "OFFER_UNAVAILABLE"
  | "WAITLIST_NOT_NEEDED"
  | "INVALID_LOGIN_LINK"
  | "AUTH_RATE_LIMIT"
  | "MAIL_UNAVAILABLE"
  | "FORBIDDEN"
  | "STALE_MATCH"
  | "CAPACITY_TOO_SMALL"
  | "PLAYER_NOT_FOUND"
  | "PLAYER_CONFLICT"
  | "CANCELLATION_CLOSED";

/** Describe un rechazo del negocio; no conoce códigos HTTP ni bases de datos. */
export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
