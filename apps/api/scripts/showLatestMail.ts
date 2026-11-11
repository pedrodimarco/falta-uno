import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig, loadEnvironmentFile } from "../src/config/environment.ts";

loadEnvironmentFile();
const { mailDirectory } = loadConfig();
try {
  const files = (await readdir(mailDirectory))
    .filter((file) => file.endsWith(".json"))
    .sort();
  const onlyOffers = process.argv.includes("--offers");
  let mail;
  for (const filename of files.reverse()) {
    const candidate = JSON.parse(
      await readFile(path.join(mailDirectory, filename), "utf8"),
    );
    if (!onlyOffers || candidate.kind === "offer") {
      mail = candidate;
      break;
    }
  }
  if (!mail)
    throw new Error(
      onlyOffers
        ? "Todavía no hay avisos de cupos. Cancelá un lugar en un partido con lista de espera."
        : "Todavía no se generaron correos. Pedí un enlace desde la aplicación.",
    );
  console.log(
    `Para: ${mail.to}\nAsunto: ${mail.subject}\n\n${mail.text}\n\nVence: ${mail.expiresAt}`,
  );
} catch (error) {
  console.error(
    error instanceof Error && "code" in error && error.code === "ENOENT"
      ? "Todavía no hay correos de prueba. Pedí un enlace desde la aplicación."
      : error instanceof Error
        ? error.message
        : "No se pudo abrir el correo.",
  );
  process.exitCode = 1;
}
