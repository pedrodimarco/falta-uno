import { Router } from "express";
import type { SessionUseCases } from "../services/interfaces/SessionUseCases.ts";
import { createMobileSessionController } from "../controllers/mobileSessionController.ts";

export function createMobileSessionRoutes(sessions: SessionUseCases) {
  const router = Router();
  const controller = createMobileSessionController(sessions);
  router.get("/", controller.current);
  router.post("/request-link", controller.requestLink);
  router.post("/verify", controller.verify);
  router.delete("/", controller.logout);
  return router;
}
