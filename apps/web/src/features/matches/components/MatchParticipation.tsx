import { OfferActions } from "./OfferActions";
import { WaitlistActions } from "./WaitlistActions";
import { useState } from "react";
import type { MatchDetail } from "@busco/contracts";
import { LoginForm } from "../../session/components/LoginForm";
import { ErrorNotice } from "../../../shared/components/ErrorNotice";

type MatchParticipationProps = {
  match: MatchDetail;
  requiresLogin: boolean;
  sessionReady: boolean;
  pending: boolean;
  error: string;
  onConfirm: () => Promise<boolean>;
  onCancel: () => Promise<boolean>;
  onJoinWaitlist: () => Promise<boolean>;
  onLeaveWaitlist: () => Promise<boolean>;
  onAcceptOffer: (offerId: string) => Promise<boolean>;
  onDeclineOffer: (offerId: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
};

export function MatchParticipation({
  match,
  requiresLogin,
  sessionReady,
  pending,
  error,
  onConfirm,
  onCancel,
  onJoinWaitlist,
  onLeaveWaitlist,
  onAcceptOffer,
  onDeclineOffer,
  onRefresh,
}: MatchParticipationProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function handleCancel() {
    if (await onCancel()) setConfirmCancel(false);
  }

  function renderContent() {
    if (requiresLogin && match.joined)
      return <LoginForm returnTo={`/partidos/${match.id}`} />;
    if (match.joined) {
      return (
        <>
          <h2>¡Estás en el partido!</h2>
          <p className="muted">Tu lugar está confirmado.</p>
          {!match.closed &&
            (confirmCancel ? (
              <div className="cancel-confirm">
                <p>¿Querés liberar tu lugar?</p>
                <button
                  className="danger"
                  disabled={pending}
                  onClick={handleCancel}
                >
                  {pending ? "Cancelando…" : "Sí, cancelar mi lugar"}
                </button>
                <button
                  disabled={pending}
                  onClick={() => setConfirmCancel(false)}
                >
                  Seguir jugando
                </button>
              </div>
            ) : (
              <button disabled={pending} onClick={() => setConfirmCancel(true)}>
                Cancelar mi lugar
              </button>
            ))}
        </>
      );
    }

    if (match.closed) return <h2>El partido ya comenzó.</h2>;

    if (requiresLogin) return <LoginForm returnTo={`/partidos/${match.id}`} />;
    if (match.offer)
      return (
        <OfferActions
          offer={match.offer}
          timeZone={match.timeZone}
          pending={pending}
          onAccept={onAcceptOffer}
          onDecline={onDeclineOffer}
          onRefresh={onRefresh}
        />
      );
    if (
      match.waitlistState === "waiting" ||
      match.confirmed + match.reserved >= match.capacity
    )
      return (
        <WaitlistActions
          match={match}
          pending={pending}
          onJoin={onJoinWaitlist}
          onLeave={onLeaveWaitlist}
        />
      );
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onConfirm();
        }}
      >
        <h2>¿Te sumás?</h2>
        <button className="primary" disabled={pending || !sessionReady}>
          {pending ? "Confirmando…" : "Confirmar mi lugar"}
        </button>
      </form>
    );
  }

  return (
    <div className="participation" aria-live="polite">
      {renderContent()}
      <ErrorNotice message={error} />
    </div>
  );
}
