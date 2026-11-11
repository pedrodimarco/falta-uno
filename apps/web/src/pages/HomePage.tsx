import { Link } from "react-router-dom";
import { useSession } from "../features/session/useSession";
import { LoginForm } from "../features/session/components/LoginForm";
import { useMyMatches } from "../features/matches/hooks/useMyMatches";
import { MatchCard } from "../features/matches/components/MatchCard";
import { ErrorNotice } from "../shared/components/ErrorNotice";
import { Loading } from "../shared/components/Loading";

export function HomePage() {
  const { person, ready } = useSession();
  const { matches, loading, error, reload } = useMyMatches(
    person?.email ? person.id : undefined,
  );

  function renderContent() {
    if (!ready) return <Loading />;

    if (!person?.email) {
      return (
        <section className="welcome">
          <div>
            <h2>Armá el partido de la semana.</h2>
            <p>
              Elegí cuándo y dónde. Tus amigos confirman desde el enlace que les
              mandás.
            </p>
            <Link className="button primary" to="/partidos/nuevo">
              Crear mi primer partido <span>↗</span>
            </Link>
          </div>
          <LoginForm />
        </section>
      );
    }

    let content;
    if (loading) {
      content = <Loading />;
    } else if (error) {
      content = (
        <>
          <ErrorNotice message={error} />
          <button onClick={reload}>Volver a intentar</button>
        </>
      );
    } else if (matches.length === 0) {
      content = (
        <div className="empty">
          <h3>Todavía no tenés partidos.</h3>
          <p>Creá uno o abrí el enlace de un amigo para sumarte.</p>
          <Link className="button primary" to="/partidos/nuevo">
            Crear un partido
          </Link>
        </div>
      );
    } else {
      content = (
        <div className="match-grid">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      );
    }

    return (
      <section>
        <div className="section-heading">
          <h2>Mis partidos</h2>
          <Link to="/partidos/nuevo">+ Crear otro</Link>
        </div>
        {content}
      </section>
    );
  }

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">HACÉ LUGAR PARA JUGAR</p>
        <h1>
          El próximo partido,
          <br />
          <em>ya organizado.</em>
        </h1>
        <p className="muted">
          Crealo, compartí el enlace y completá los cupos.
        </p>
      </section>
      {renderContent()}
    </>
  );
}
