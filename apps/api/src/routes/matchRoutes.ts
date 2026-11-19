import type { MatchManagementUseCases } from "../services/interfaces/MatchManagementUseCases.ts";
import { createMatchManagementController } from "../controllers/matchManagementController.ts";
import type { WaitlistUseCases } from "../services/interfaces/WaitlistUseCases.ts";
import { createWaitlistController } from "../controllers/waitlistController.ts";
import { Router } from "express";
import type { MatchUseCases } from "../services/interfaces/MatchUseCases.ts";
import { createMatchController } from "../controllers/matchController.ts";

export function createMatchRoutes(
  matches: MatchUseCases,
  waitlist: WaitlistUseCases,
  management: MatchManagementUseCases,
): Router {
  const router = Router();
  const waiting = createWaitlistController(waitlist, matches);
  router.put("/:id/waitlist", waiting.join);
  router.delete("/:id/waitlist", waiting.leave);
  router.post("/:id/offers/:offerId/accept", waiting.accept);
  router.post("/:id/offers/:offerId/decline", waiting.decline);
  const manager = createMatchManagementController(management, matches);
  router.patch("/:id", manager.update);
  router.post("/:id/players", manager.addPlayer);
  router.delete("/:id/players/:personId", manager.removePlayer);
  const controller = createMatchController(matches);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:id", controller.detail);
  router.put("/:id/participation", controller.join);
  router.delete("/:id/participation", controller.leave);
  return router;
}
