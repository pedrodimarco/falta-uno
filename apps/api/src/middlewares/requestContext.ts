import type { Response } from "express";
import type { SessionPerson } from "../models/Person.ts";
import { HttpError } from "../errors/HttpError.ts";

declare global {
  namespace Express {
    interface Locals {
      person: SessionPerson | null;
    }
  }
}

export function requirePerson(response: Response): SessionPerson {
  if (!response.locals.person?.email) {
    throw new HttpError(
      401,
      "IDENTITY_REQUIRED",
      "Ingresá con tu correo para continuar.",
    );
  }
  return response.locals.person;
}
