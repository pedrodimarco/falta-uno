import type { RequestHandler } from "express";
import {
  matchInput,
  type MatchDetail,
  type MatchSummary,
} from "@falta-uno/contracts";
import type { MatchUseCases } from "../services/interfaces/MatchUseCases.ts";
import { requirePerson } from "../middlewares/requestContext.ts";

export function createMatchController(matches: MatchUseCases) {
  return {
    list: (_request, response) => {
      const person = requirePerson(response);
      const body: MatchSummary[] = matches.list(person.id);
      response.json(body);
    },
    create: (request, response) => {
      const person = requirePerson(response);
      const input = matchInput.parse(request.body);
      const body: MatchDetail = matches.create(input, person);
      response.status(201).json(body);
    },
    detail: (request, response) => {
      const body: MatchDetail = matches.detail(
        String(request.params.id),
        response.locals.person?.id,
      );
      response.json(body);
    },
    join: (request, response) => {
      const person = requirePerson(response);
      const body: MatchDetail = matches.join(
        String(request.params.id),
        person.id,
      );
      response.json(body);
    },
    leave: (request, response) => {
      const person = requirePerson(response);
      const body: MatchDetail = matches.leave(
        String(request.params.id),
        person.id,
      );
      response.json(body);
    },
  } satisfies Record<string, RequestHandler>;
}
