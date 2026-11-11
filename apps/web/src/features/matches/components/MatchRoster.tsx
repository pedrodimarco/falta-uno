import type { MatchDetail } from "@falta-uno/contracts";

type MatchRosterProps = {
  match: MatchDetail;
  currentPersonId?: string;
};

export function MatchRoster({ match, currentPersonId }: MatchRosterProps) {
  return (
    <section className="roster">
      <div className="section-heading">
        <h2>Quiénes juegan</h2>
        <span className="muted">
          {match.confirmed}{" "}
          {match.confirmed === 1 ? "confirmado" : "confirmados"}
        </span>
      </div>
      {match.players.length ? (
        <ol className="player-list">
          {match.players.map((p, i) => (
            <li key={p.id}>
              <span className="player-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="avatar" aria-hidden="true">
                {p.name.slice(0, 1).toUpperCase()}
              </span>
              <span>
                {p.name}
                {p.id === currentPersonId ? " (vos)" : ""}
              </span>
              {p.id === match.organizer.id && (
                <span className="organizer-tag">Organiza</span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty small-empty">
          Todavía no hay jugadores. ¡Podés ser el primero!
        </p>
      )}
    </section>
  );
}
