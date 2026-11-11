import type { WaitlistUseCases } from "./services/interfaces/WaitlistUseCases.ts";
import express from "express";
import path from "node:path";
import type { MatchUseCases } from "./services/interfaces/MatchUseCases.ts";
import type { SessionUseCases } from "./services/interfaces/SessionUseCases.ts";
import { createMatchRoutes } from "./routes/matchRoutes.ts";
import { createSessionRoutes } from "./routes/sessionRoutes.ts";
import { createMobileSessionRoutes } from "./routes/mobileSessionRoutes.ts";
import { resolveSession } from "./middlewares/resolveSession.ts";
import { apiSecurity, securityHeaders } from "./middlewares/security.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";

interface AppDependencies {
  matches: MatchUseCases;
  sessions: SessionUseCases;
  waitlist: WaitlistUseCases;
}

export interface HttpOptions {
  webDirectory?: string;
  secureCookies?: boolean;
  allowedOrigins?: readonly string[];
}

/** Compone HTTP con casos de uso inyectados. No abre bases ni puertos. */
export function createApp(
  services: AppDependencies,
  options: HttpOptions = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(
    "/api",
    apiSecurity(options.allowedOrigins ?? []),
    express.json({ limit: "16kb" }),
  );
  app.get("/api/health", (_request, response) => response.json({ ok: true }));
  app.use("/api", resolveSession(services.sessions));
  app.use("/api/mobile/session", createMobileSessionRoutes(services.sessions));
  app.use(
    "/api/session",
    createSessionRoutes(services.sessions, options.secureCookies ?? false),
  );
  app.use(
    "/api/matches",
    createMatchRoutes(services.matches, services.waitlist),
  );
  app.use("/api", (_request, response) => {
    response
      .status(404)
      .json({ error: "La ruta no existe.", code: "NOT_FOUND" });
  });

  const { webDirectory } = options;
  if (webDirectory) {
    app.use(express.static(webDirectory));
    app.get("/{*path}", (_request, response) =>
      response.sendFile(path.join(webDirectory, "index.html")),
    );
  }
  app.use(errorHandler);
  return app;
}
