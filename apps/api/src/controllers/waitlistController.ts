import type { RequestHandler } from "express";
import type { WaitlistUseCases } from "../services/interfaces/WaitlistUseCases.ts";
import type { MatchUseCases } from "../services/interfaces/MatchUseCases.ts";
import { requirePerson } from "../middlewares/requestContext.ts";
export function createWaitlistController(
  waitlist: WaitlistUseCases,
  matches: MatchUseCases,
) {
  return {
    join: (request, response) => {
      const person = requirePerson(response),
        id = String(request.params.id);
      waitlist.join(id, person.id);
      response.json(matches.detail(id, person.id));
    },
    leave: (request, response) => {
      const person = requirePerson(response),
        id = String(request.params.id);
      waitlist.leave(id, person.id);
      response.json(matches.detail(id, person.id));
    },
    accept: (request, response) => {
      const person = requirePerson(response),
        id = String(request.params.id);
      waitlist.accept(id, String(request.params.offerId), person.id);
      response.json(matches.detail(id, person.id));
    },
    decline: (request, response) => {
      const person = requirePerson(response),
        id = String(request.params.id);
      waitlist.decline(id, String(request.params.offerId), person.id);
      response.json(matches.detail(id, person.id));
    },
  } satisfies Record<string, RequestHandler>;
}
