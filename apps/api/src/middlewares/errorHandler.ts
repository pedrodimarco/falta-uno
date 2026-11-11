import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { DomainError, type DomainErrorCode } from "../errors/DomainError.ts";
import { HttpError } from "../errors/HttpError.ts";

const domainStatus: Record<DomainErrorCode, number> = {
  NOT_FOUND: 404,
  PAST_DATE: 422,
  CLOSED: 409,
  FULL: 409,
  OFFER_REQUIRED: 409,
  OFFER_UNAVAILABLE: 409,
  WAITLIST_NOT_NEEDED: 409,
  INVALID_LOGIN_LINK: 400,
  AUTH_RATE_LIMIT: 429,
  MAIL_UNAVAILABLE: 503,
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  if (error instanceof DomainError || error instanceof HttpError) {
    const status =
      error instanceof DomainError ? domainStatus[error.code] : error.status;
    response.status(status).json({ error: error.message, code: error.code });
    return;
  }
  if (error instanceof ZodError) {
    response.status(422).json({
      error: "Revisá los datos del formulario.",
      code: "VALIDATION",
      fields: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    response
      .status(400)
      .json({ error: "El cuerpo JSON no es válido.", code: "INVALID_JSON" });
    return;
  }
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    error.status === 413
  ) {
    response
      .status(413)
      .json({ error: "La solicitud es demasiado grande.", code: "TOO_LARGE" });
    return;
  }
  console.error(error);
  response.status(500).json({
    error: "No pudimos completar la operación. Intentá de nuevo.",
    code: "INTERNAL",
  });
};
