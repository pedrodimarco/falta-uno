import type { MatchDetail } from "@falta-uno/contracts";
import { useSession } from "../../session/useSession";
interface Props {
  match: MatchDetail;
  pending: boolean;
  onJoin: () => Promise<boolean>;
  onLeave: () => Promise<boolean>;
}
export function WaitlistActions({ match, pending, onJoin, onLeave }: Props) {
  const { localMail } = useSession();
  if (match.waitlistState === "waiting")
    return (
      <section className="waitlist-actions">
        <h2>Estás en la lista de espera.</h2>
        <p>
          Tu posición es <strong>{match.waitlistPosition}</strong>.
        </p>
        <p className="muted">
          {localMail
            ? "Cuando haya un lugar, el aviso se guardará en el buzón local de prueba."
            : "Te avisaremos por correo cuando se libere un lugar."}
        </p>
        <button disabled={pending} onClick={() => onLeave()}>
          {pending ? "Procesando…" : "Salir de la lista de espera"}
        </button>
      </section>
    );
  return (
    <section className="waitlist-actions">
      <h2>No hay cupos libres.</h2>
      {match.waitlistState === "expired" && (
        <p>
          Tu oferta anterior venció. Podés volver a anotarte al final de la
          lista.
        </p>
      )}
      {match.waitlistState === "declined" && (
        <p>
          Rechazaste la oferta anterior. Podés volver a anotarte al final de la
          lista.
        </p>
      )}
      <p className="muted">
        Anotate y te ofreceremos un lugar por orden de inscripción.
      </p>
      <button className="primary" disabled={pending} onClick={() => onJoin()}>
        {pending ? "Anotando…" : "Anotarme en lista de espera"}
      </button>
    </section>
  );
}
