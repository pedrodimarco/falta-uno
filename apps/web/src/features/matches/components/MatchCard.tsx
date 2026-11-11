import { Link } from "react-router-dom";
import type { MatchSummary } from "@falta-uno/contracts";
import { formatMatchDate } from "../formatters";

export function MatchCard({ match }: { match: MatchSummary }) {
  return (
    <Link className="match-card" to={`/partidos/${match.id}`}>
      <div className="card-top">
        <span className="eyebrow">{match.sport}</span>
        <span className="pill">
          {Date.parse(match.startsAt) <= Date.now()
            ? "Comenzó"
            : match.confirmed + match.reserved >= match.capacity
              ? "Completo"
              : `Libres ${match.capacity - match.confirmed - match.reserved}`}
        </span>
      </div>
      <h3>{match.title}</h3>
      <p>{formatMatchDate(match)}</p>
      <p className="muted">{match.venue}</p>
      <div className="card-bottom">
        <strong>
          {match.confirmed} / {match.capacity} confirmados
          {match.reserved > 0 ? ` · ${match.reserved} reservados` : ""}
        </strong>
        <span aria-hidden="true">↗</span>
      </div>
    </Link>
  );
}
