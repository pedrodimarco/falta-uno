import type { RequestHandler } from "express";
import { requestLoginInput, verifyMobileLoginInput } from "@busco/contracts";
import type { SessionUseCases } from "../services/interfaces/SessionUseCases.ts";
import { readBearerToken } from "../security/sessionToken.ts";

/** Transporte nativo; comparte identidad y reglas con la sesión web. */
export function createMobileSessionController(sessions: SessionUseCases) {
  return {
    current: (request, response) => {
      response.json({
        person: sessions.findPerson(readBearerToken(request)),
        localMail: sessions.localMail,
      });
    },
    requestLink: async (request, response) => {
      const input = requestLoginInput.parse(request.body);
      const result = await sessions.requestLink({
        ...input,
        ip: request.ip ?? "unknown",
        existingToken: readBearerToken(request),
      });
      // Es la prueba de solicitud, no el secreto que se entrega por correo.
      response.status(202).json({ ...result, localMail: sessions.localMail });
    },
    verify: (request, response) => {
      const { token, flowToken } = verifyMobileLoginInput.parse(request.body);
      const result = sessions.verify(
        token,
        flowToken,
        readBearerToken(request),
      );
      response.json(result);
    },
    logout: (request, response) => {
      sessions.logout(readBearerToken(request));
      response.status(204).end();
    },
  } satisfies Record<string, RequestHandler>;
}
