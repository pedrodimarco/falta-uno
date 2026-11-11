import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type {
  LoginEmail,
  MagicLinkMailer,
} from "../services/interfaces/MagicLinkMailer.ts";

/** Buzón local de desarrollo. No envía correos a Internet. */
export class FileMagicLinkMailer implements MagicLinkMailer {
  readonly deliveryMode = "local" as const;
  constructor(private readonly directory: string) {}
  async send(message: LoginEmail): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const filename = path.join(
      this.directory,
      `${Date.now()}-${randomUUID()}.json`,
    );
    await writeFile(
      filename,
      JSON.stringify(
        {
          ...message,
          kind: "login",
          subject: "Tu enlace para entrar a Falta uno",
          text: `Abrí este enlace en el navegador donde lo pediste:\n${message.url}\n\nVence en 10 minutos y se puede usar una sola vez. Si no lo pediste, ignorá este correo.`,
        },
        null,
        2,
      ),
      { mode: 0o600, flag: "wx" },
    );
  }
}
