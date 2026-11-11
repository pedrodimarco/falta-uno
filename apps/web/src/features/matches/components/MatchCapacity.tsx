import type { MatchDetail } from "@falta-uno/contracts";
export function MatchCapacity({ match }: { match: MatchDetail }) {
  const available = match.capacity - match.confirmed - match.reserved;
  return (
    <section className="capacity-box">
      <p className="eyebrow">EL EQUIPO SE ESTÁ ARMANDO</p>
      <p className="capacity-number">
        {match.confirmed}
        <span> / {match.capacity}</span>
      </p>
      <div
        className="meter"
        role="progressbar"
        aria-label="Cupos ocupados o reservados"
        aria-valuenow={match.confirmed + match.reserved}
        aria-valuemin={0}
        aria-valuemax={match.capacity}
        aria-valuetext={`${match.confirmed} confirmados y ${match.reserved} reservados de ${match.capacity}`}
      >
        <span
          style={{ width: `${(match.confirmed / match.capacity) * 100}%` }}
        />
        <span
          className="reserved-meter"
          style={{ width: `${(match.reserved / match.capacity) * 100}%` }}
        />
      </div>
      <p>
        {match.closed
          ? "Las inscripciones están cerradas."
          : available === 0
            ? "No quedan lugares libres."
            : `${available} ${available === 1 ? "lugar disponible" : "lugares disponibles"}.`}
      </p>
      {match.reserved > 0 && (
        <p>
          {match.reserved}{" "}
          {match.reserved === 1 ? "lugar reservado" : "lugares reservados"} para
          la lista de espera.
        </p>
      )}
    </section>
  );
}
