import type { MatchDetail } from "@busco/contracts";
export function WaitlistRoster({
  entries,
}: {
  entries: MatchDetail["waitingList"];
}) {
  if (entries.length === 0) return null;
  return (
    <section className="waitlist-roster">
      <div className="section-heading">
        <h2>Lista de espera</h2>
        <span className="muted">
          {entries.length} {entries.length === 1 ? "persona" : "personas"}
        </span>
      </div>
      <ol className="player-list">
        {entries.map((entry) => (
          <li key={entry.person.id}>
            <span className="player-number">{entry.position}</span>
            <span>{entry.person.name}</span>
            <span className="organizer-tag">
              {entry.status === "offered" ? "Oferta pendiente" : "En espera"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
