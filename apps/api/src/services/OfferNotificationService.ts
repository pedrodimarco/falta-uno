import type { OfferNotificationRepository } from "../repositories/interfaces/OfferNotificationRepository.ts";
import type {
  Clock,
  IdGenerator,
  TransactionManager,
} from "./interfaces/dependencies.ts";
import type { OfferMailer } from "./interfaces/OfferMailer.ts";
interface Dependencies {
  notifications: OfferNotificationRepository;
  transactions: TransactionManager;
  clock: Clock;
  generateId: IdGenerator;
  mailer: OfferMailer;
  publicUrl: string;
}
export class OfferNotificationService {
  constructor(private readonly dependencies: Dependencies) {}
  async dispatchPending(): Promise<void> {
    const {
      notifications,
      transactions,
      clock,
      generateId,
      mailer,
      publicUrl,
    } = this.dependencies;
    for (let count = 0; count < 20; count++) {
      const now = clock.now().getTime();
      const message = transactions.run(() =>
        notifications.claimNext(now, now + 60_000, generateId()),
      );
      if (!message) return;
      try {
        await mailer.send({
          notificationId: message.id,
          createdAt: message.createdAt,
          to: message.to,
          name: message.name,
          title: message.title,
          url: `${publicUrl}/partidos/${encodeURIComponent(message.matchId)}`,
          expiresAt: new Date(message.expiresAt).toISOString(),
          timeZone: message.timeZone,
        });
        transactions.run(() =>
          notifications.markSent(
            message.id,
            message.leaseToken,
            clock.now().getTime(),
          ),
        );
      } catch {
        const delay = Math.min(
          300_000,
          5_000 * 2 ** Math.min(message.attempts - 1, 6),
        );
        transactions.run(() =>
          notifications.retry(
            message.id,
            message.leaseToken,
            clock.now().getTime() + delay,
          ),
        );
      }
    }
  }
}
