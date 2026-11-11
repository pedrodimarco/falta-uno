import type { RequestHandler } from "express";
import type { SessionUseCases } from "../services/interfaces/SessionUseCases.ts";
import { readRequestSessionToken } from "../security/sessionToken.ts";
import "./requestContext.ts";

export function resolveSession(sessions: SessionUseCases): RequestHandler {
  return (request, response, next) => {
    response.locals.person = sessions.findPerson(
      readRequestSessionToken(request),
    );
    next();
  };
}
