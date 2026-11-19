import type { RequestHandler } from "express";
import { updateMatchInput, addMatchPlayerInput } from "@falta-uno/contracts";
import type { MatchManagementUseCases } from "../services/interfaces/MatchManagementUseCases.ts";
import type { MatchUseCases } from "../services/interfaces/MatchUseCases.ts";
import { requirePerson } from "../middlewares/requestContext.ts";
export function createMatchManagementController(
  management: MatchManagementUseCases,
  matches: MatchUseCases,
) {
  return {
    update: (request, response) => {
      const person = requirePerson(response),
        id = String(request.params.id);
      management.update(id, updateMatchInput.parse(request.body), person.id);
      response.json(matches.detail(id, person.id));
    },
    addPlayer: (request, response) => {
      const person = requirePerson(response),
        id = String(request.params.id);
      management.addPlayer(
        id,
        addMatchPlayerInput.parse(request.body),
        person.id,
      );
      response.json(matches.detail(id, person.id));
    },
    removePlayer: (request, response) => {
      const person = requirePerson(response),
        id = String(request.params.id);
      management.removePlayer(id, String(request.params.personId), person.id);
      response.json(matches.detail(id, person.id));
    },
  } satisfies Record<string, RequestHandler>;
}
