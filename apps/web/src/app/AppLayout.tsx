import { Link, Outlet } from "react-router-dom";
import { SessionMenu } from "../features/session/components/SessionMenu";
import { useSession } from "../features/session/useSession";

export function AppLayout() {
  const { person } = useSession();
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">
          busco player <span>↗</span>
        </Link>
        <nav aria-label="Principal">
          <SessionMenu />
          <Link to="/">Mis partidos</Link>
          <Link className="button small" to="/partidos/nuevo">
            Crear partido
          </Link>
        </nav>
      </header>
      <main>
        <div className="identity-line">
          ENTRE AMIGOS{" "}
          <span>
            {person?.email
              ? `Jugás como ${person.name}`
              : "Tu próximo partido empieza acá"}
          </span>
        </div>
        <Outlet />
      </main>
      <footer className="site-footer">
        Menos mensajes. Más juego.
        <span>Organizá con tus amigos</span>
      </footer>
    </>
  );
}
