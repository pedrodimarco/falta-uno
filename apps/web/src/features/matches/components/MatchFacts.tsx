import type { MatchDetail } from "@falta-uno/contracts";
import { formatMatchDate, formatMatchPrice } from "../formatters";

export function MatchFacts({ match }: { match: MatchDetail }) {
  return (
    <dl className="match-facts">
      <div>
        <dt>Cuándo</dt>
        <dd>
          {formatMatchDate(match)}
          <span className="help">{match.timeZone}</span>
        </dd>
      </div>
      <div>
        <dt>Dónde</dt>
        <dd>{match.venue}</dd>
      </div>
      <div>
        <dt>Costo</dt>
        <dd>{formatMatchPrice(match)}</dd>
      </div>
    </dl>
  );
}
