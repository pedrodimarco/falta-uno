import { WaitlistService } from "./services/WaitlistService.ts";
import { OfferNotificationService } from "./services/OfferNotificationService.ts";
import { SqliteWaitlistRepository } from "./repositories/sqlite/SqliteWaitlistRepository.ts";
import { SqliteOfferNotificationRepository } from "./repositories/sqlite/SqliteOfferNotificationRepository.ts";
import { FileOfferMailer } from "./mail/FileOfferMailer.ts";
import { WaitlistWorker } from "./jobs/WaitlistWorker.ts";
import type { OfferMailer } from "./services/interfaces/OfferMailer.ts";
import { randomUUID } from "node:crypto";
import { createApp, type HttpOptions } from "./app.ts";
import { MatchService } from "./services/MatchService.ts";
import { SessionService } from "./services/SessionService.ts";
import type { Clock } from "./services/interfaces/dependencies.ts";
import { openDatabase } from "./database/connection.ts";
import { SqliteMatchRepository } from "./repositories/sqlite/SqliteMatchRepository.ts";
import { SqliteSessionRepository } from "./repositories/sqlite/SqliteSessionRepository.ts";
import { SqliteTransactionManager } from "./database/SqliteTransactionManager.ts";
import { FileMagicLinkMailer } from "./mail/FileMagicLinkMailer.ts";
import { SqliteLoginLinkRepository } from "./repositories/sqlite/SqliteLoginLinkRepository.ts";
import type { MagicLinkMailer } from "./services/interfaces/MagicLinkMailer.ts";
import path from "node:path";
import { CryptoSessionTokens } from "./security/CryptoSessionTokens.ts";

export interface ApplicationOptions extends HttpOptions {
  databasePath: string;
  clock?: Clock;
  publicUrl?: string;
  mailDirectory?: string;
  mailer?: MagicLinkMailer;
  offerMailer?: OfferMailer;
  jobIntervalMs?: number;
}

/** Único punto donde se eligen y conectan las implementaciones concretas. */
export function createApplication(options: ApplicationOptions) {
  if (
    options.secureCookies &&
    (!options.mailer ||
      options.mailer.deliveryMode === "local" ||
      !options.offerMailer ||
      options.offerMailer.deliveryMode === "local")
  ) {
    throw new Error(
      "El buzón local no se puede utilizar en producción. Configurá un adaptador de envío real.",
    );
  }
  const publicUrl = new URL(options.publicUrl ?? "http://127.0.0.1:5173");
  if (
    !["http:", "https:"].includes(publicUrl.protocol) ||
    publicUrl.username ||
    publicUrl.password ||
    publicUrl.pathname !== "/" ||
    publicUrl.search ||
    publicUrl.hash
  )
    throw new Error("APP_URL debe contener solo el origen de la aplicación.");
  if (options.secureCookies && publicUrl.protocol !== "https:")
    throw new Error("APP_URL debe usar HTTPS en producción.");
  const database = openDatabase(options.databasePath);
  try {
    const clock = options.clock ?? { now: () => new Date() };
    const transactions = new SqliteTransactionManager(database);
    const matchRepository = new SqliteMatchRepository(database);
    const notificationRepository = new SqliteOfferNotificationRepository(
      database,
    );
    const mailDirectory =
      options.mailDirectory ??
      path.join(path.dirname(options.databasePath), "mail");
    const waitlist = new WaitlistService({
      matches: matchRepository,
      waitlist: new SqliteWaitlistRepository(database),
      notifications: notificationRepository,
      transactions,
      clock,
      generateId: randomUUID,
    });
    const notifications = new OfferNotificationService({
      notifications: notificationRepository,
      transactions,
      clock,
      generateId: randomUUID,
      mailer: options.offerMailer ?? new FileOfferMailer(mailDirectory),
      publicUrl: publicUrl.origin,
    });
    const worker = new WaitlistWorker(
      {
        processPending: () => waitlist.processPending(),
        dispatchPending: () => notifications.dispatchPending(),
      },
      options.jobIntervalMs,
    );
    const matches = new MatchService({
      matches: matchRepository,
      waitlist,
      transactions,
      clock,
      generateId: randomUUID,
    });
    const sessions = new SessionService({
      sessions: new SqliteSessionRepository(database),
      links: new SqliteLoginLinkRepository(database),
      mailer: options.mailer ?? new FileMagicLinkMailer(mailDirectory),
      publicUrl: publicUrl.origin,
      transactions,
      clock,
      generateId: randomUUID,
      tokens: new CryptoSessionTokens(),
    });
    return {
      app: createApp({ matches, sessions, waitlist }, options),
      startBackgroundJobs: () => worker.start(),
      runMaintenance: () => worker.runOnce(),
      close: async () => {
        try {
          await worker.stop();
        } finally {
          database.close();
        }
      },
    };
  } catch (error) {
    database.close();
    throw error;
  }
}
