import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const developmentOrigins = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:8081",
  "http://localhost:8081",
];

export function loadEnvironmentFile() {
  const filename = path.join(projectRoot, ".env");
  if (existsSync(filename)) process.loadEnvFile(filename);
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env) {
  const port = Number(environment.PORT || 3001);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT debe ser un entero entre 1 y 65535.");
  }
  const production = environment.NODE_ENV === "production";

  return {
    publicUrl: environment.APP_URL || "http://127.0.0.1:5173",
    mailDirectory:
      environment.MAIL_DIRECTORY || path.join(projectRoot, ".data/mail"),
    port,
    host: environment.HOST || "127.0.0.1",
    databasePath:
      environment.DATABASE_PATH ||
      path.join(projectRoot, ".data/busco-player.sqlite"),
    webDirectory: path.join(projectRoot, "apps/web/dist"),
    secureCookies: production,
    allowedOrigins: production ? [] : developmentOrigins,
  };
}
