import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="empty">
      <h1>No encontramos esta página.</h1>
      <Link to="/">Volver a mis partidos</Link>
    </section>
  );
}
