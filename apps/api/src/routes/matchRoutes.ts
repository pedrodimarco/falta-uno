import type { WaitlistUseCases } from "../services/interfaces/WaitlistUseCases.ts";
import { createWaitlistController } from "../controllers/waitlistController.ts";
import { Router } from "express";
import type { MatchUseCases } from "../services/interfaces/MatchUseCases.ts";
import { createMatchController } from "../controllers/matchController.ts";

export function createMatchRoutes(
  matches: MatchUseCases,
  waitlist: WaitlistUseCases,
): Router {
  const router = Router();
  const waiting = createWaitlistController(waitlist, matches);
  router.put("/:id/waitlist", waiting.join);
  router.delete("/:id/waitlist", waiting.leave);
  router.post("/:id/offers/:offerId/accept", waiting.accept);
  router.post("/:id/offers/:offerId/decline", waiting.decline);
  const controller = createMatchController(matches);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:id", controller.detail);
  router.put("/:id/participation", controller.join);
  router.delete("/:id/participation", controller.leave);
  return router;
}
