import { Router } from "express";
import type { SessionUseCases } from "../services/interfaces/SessionUseCases.ts";
import { createSessionController } from "../controllers/sessionController.ts";
export function createSessionRoutes(
  sessions: SessionUseCases,
  secureCookies: boolean,
): Router {
  const router = Router();
  const controller = createSessionController(sessions, secureCookies);
  router.get("/", controller.current);
  router.post("/request-link", controller.requestLink);
  router.post("/verify", controller.verify);
  router.delete("/", controller.logout);
  return router;
}
