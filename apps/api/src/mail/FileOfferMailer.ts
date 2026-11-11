import { mkdir, writeFile, rename, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type {
  OfferEmail,
  OfferMailer,
} from "../services/interfaces/OfferMailer.ts";
/** Nombre estable por aviso: reintentar no crea varios correos locales. */
export class FileOfferMailer implements OfferMailer {
  readonly deliveryMode = "local" as const;
  constructor(private readonly directory: string) {}
  async send(message: OfferEmail): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const filename = path.join(
      this.directory,
      `${message.createdAt}-offer-${message.notificationId}.json`,
    );
    const temporary = filename + `.${randomUUID()}.tmp`;
    const deadline = new Intl.DateTimeFormat("es-UY", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: message.timeZone,
    }).format(new Date(message.expiresAt));
    const content = {
      ...message,
      kind: "offer",
      subject: `Se liberó un lugar: ${message.title}`,
      text: `Hola ${message.name}.\nSe liberó un lugar en ${message.title}. Está reservado para vos hasta ${deadline} (${message.timeZone}).\nAbrí el partido para aceptar o rechazar la oferta:\n${message.url}\nSi necesitás ingresar, pedí un enlace de acceso con este mismo correo. Abrir este aviso no confirma tu asistencia.`,
    };
    try {
      await writeFile(temporary, JSON.stringify(content, null, 2), {
        mode: 0o600,
        flag: "wx",
      });
      await rename(temporary, filename);
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }
}
