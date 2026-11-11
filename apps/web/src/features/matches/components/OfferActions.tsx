import { useEffect, useState } from "react";
import type { MatchDetail } from "@busco/contracts";
interface Props {
  offer: NonNullable<MatchDetail["offer"]>;
  timeZone: string;
  pending: boolean;
  onAccept: (id: string) => Promise<boolean>;
  onDecline: (id: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
}
export function OfferActions({
  offer,
  timeZone,
  pending,
  onAccept,
  onDecline,
  onRefresh,
}: Props) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(
    0,
    Math.ceil((Date.parse(offer.expiresAt) - now) / 1000),
  );
  const deadline = new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(offer.expiresAt));
  const duration =
    remaining >= 3600
      ? `${Math.floor(remaining / 3600)} h ${Math.floor((remaining % 3600) / 60)} min`
      : remaining >= 60
        ? `${Math.ceil(remaining / 60)} min`
        : `${remaining} s`;
  if (remaining === 0)
    return (
      <section className="waitlist-actions">
        <h2>El plazo de la oferta terminó.</h2>
        <p className="muted">
          Actualizá el estado para ver los cupos y la lista de espera.
        </p>
        <button disabled={pending} onClick={() => onRefresh()}>
          Actualizar estado
        </button>
      </section>
    );
  return (
    <section className="waitlist-actions">
      <h2>¡Hay un lugar para vos!</h2>
      <p>Está reservado hasta el {deadline}.</p>
      <p className="offer-countdown">Te quedan {duration}</p>
      <button
        className="primary"
        disabled={pending}
        onClick={() => onAccept(offer.id)}
      >
        {pending ? "Procesando…" : "Aceptar lugar"}
      </button>
      <button disabled={pending} onClick={() => onDecline(offer.id)}>
        Rechazar y dejar pasar al siguiente
      </button>
      <p className="help">
        Tu asistencia queda confirmada cuando aceptás la oferta.
      </p>
    </section>
  );
}
