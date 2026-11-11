import { WaitlistRoster } from "../features/matches/components/WaitlistRoster";
import { Link, useParams } from "react-router-dom";
import { useSession } from "../features/session/useSession";
import { useMatch } from "../features/matches/hooks/useMatch";
import { MatchFacts } from "../features/matches/components/MatchFacts";
import { MatchRoster } from "../features/matches/components/MatchRoster";
import { MatchCapacity } from "../features/matches/components/MatchCapacity";
import { MatchParticipation } from "../features/matches/components/MatchParticipation";
import { MatchShare } from "../features/matches/components/MatchShare";
import { ErrorNotice } from "../shared/components/ErrorNotice";
import { Loading } from "../shared/components/Loading";

export function MatchDetailPage() {
  const { id = "" } = useParams();
  const { person, ready } = useSession();
  const {
    match,
    loading,
    error,
    pending,
    actionError,
    reload,
    confirm,
    cancel,
    joinWaitlist,
    leaveWaitlist,
    acceptOffer,
    declineOffer,
  } = useMatch(id);

  if (loading) return <Loading />;
  if (error || !match) {
    return (
      <section className="empty">
        <ErrorNotice message={error} />
        <button onClick={reload}>Volver a intentar</button>
        <Link to="/">Volver al inicio</Link>
      </section>
    );
  }

  const full = match.confirmed + match.reserved >= match.capacity;
  const status = match.closed
    ? "Comenzó"
    : full
      ? match.reserved > 0
        ? "Cupos reservados"
        : "Completo"
      : "Inscripción abierta";

  return (
    <>
      <Link className="back" to="/">
        ← Mis partidos
      </Link>
      <div className="detail-layout">
        <article className="match-detail">
          <header className="page-heading compact">
            <div className="card-top">
              <p className="eyebrow">{match.sport} · ENTRE AMIGOS</p>
              <span className="pill">{status}</span>
            </div>
            <h1>{match.title}</h1>
          </header>
          <MatchFacts match={match} />
          <MatchRoster match={match} currentPersonId={person?.id} />
          <WaitlistRoster entries={match.waitingList} />
          {match.notes && (
            <section className="notes">
              <h2>Para tener en cuenta</h2>
              <p>{match.notes}</p>
            </section>
          )}
          <p className="muted organizer-line">
            Organiza {match.organizer.name}
            {match.isOrganizer ? " · Este es tu partido" : ""}
          </p>
        </article>
        <aside className="join-panel">
          <MatchCapacity match={match} />
          <MatchParticipation
            key={id}
            match={match}
            requiresLogin={!person?.email}
            sessionReady={ready}
            pending={pending}
            error={actionError}
            onConfirm={confirm}
            onCancel={cancel}
            onJoinWaitlist={joinWaitlist}
            onLeaveWaitlist={leaveWaitlist}
            onAcceptOffer={acceptOffer}
            onDeclineOffer={declineOffer}
            onRefresh={reload}
          />
          <MatchShare key={id} match={match} />
        </aside>
      </div>
    </>
  );
}
