import { Link, Outlet } from "react-router-dom";
import { SessionMenu } from "../features/session/components/SessionMenu";
import { useSession } from "../features/session/useSession";

export function AppLayout({
  showNavigation = true,
}: {
  showNavigation?: boolean;
}) {
  const { person } = useSession();
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">
          Falta uno <span>↗</span>
        </Link>
        {showNavigation ? (
          <nav aria-label="Principal">
            <SessionMenu />
            <Link to="/partidos">Mis partidos</Link>
            <Link className="button small" to="/partidos/nuevo">
              Crear partido
            </Link>
          </nav>
        ) : (
          <Link to="/">Volver al inicio</Link>
        )}
      </header>
      <main>
        <div className="identity-line">
          {showNavigation ? "ENTRE AMIGOS" : "EN DESARROLLO"}{" "}
          <span>
            {person?.email
              ? `Jugás como ${person.name}`
              : "Estamos preparando el próximo partido"}
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
