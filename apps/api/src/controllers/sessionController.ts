import type { RequestHandler } from "express";
import { requestLoginInput, verifyLoginInput } from "@falta-uno/contracts";
import type { SessionUseCases } from "../services/interfaces/SessionUseCases.ts";
import {
  readSessionToken,
  readFlowToken,
  SESSION_COOKIE_NAME,
  FLOW_COOKIE_NAME,
  sessionCookieOptions,
  flowCookieOptions,
} from "../security/sessionCookie.ts";

export function createSessionController(
  sessions: SessionUseCases,
  secureCookies: boolean,
) {
  return {
    current: (_request, response) => {
      response.json({
        person: response.locals.person,
        localMail: sessions.localMail,
      });
    },
    requestLink: async (request, response) => {
      const input = requestLoginInput.parse(request.body);
      const result = await sessions.requestLink({
        ...input,
        ip: request.ip ?? "unknown",
        existingToken: readSessionToken(request),
      });
      response.cookie(
        FLOW_COOKIE_NAME,
        result.flowToken,
        flowCookieOptions(secureCookies),
      );
      response.status(202).json({
        message: "Revisá tu correo para continuar.",
        localMail: sessions.localMail,
      });
    },
    verify: (request, response) => {
      const { token } = verifyLoginInput.parse(request.body);
      const result = sessions.verify(
        token,
        readFlowToken(request),
        readSessionToken(request),
      );
      response.cookie(
        SESSION_COOKIE_NAME,
        result.token,
        sessionCookieOptions(secureCookies),
      );
      response.clearCookie(
        FLOW_COOKIE_NAME,
        flowCookieOptions(secureCookies, false),
      );
      response.json({ person: result.person, returnTo: result.returnTo });
    },
    logout: (request, response) => {
      sessions.logout(readSessionToken(request));
      response.clearCookie(
        SESSION_COOKIE_NAME,
        sessionCookieOptions(secureCookies, false),
      );
      response.clearCookie(
        FLOW_COOKIE_NAME,
        flowCookieOptions(secureCookies, false),
      );
      response.status(204).end();
    },
  } satisfies Record<string, RequestHandler>;
}
