import { Navigate, useSearchParams } from "react-router-dom";
import { LoginForm } from "../features/session/components/LoginForm";
import { useSession } from "../features/session/useSession";
import { Loading } from "../shared/components/Loading";
export function LoginPage() {
  const [params] = useSearchParams();
  const { person, ready } = useSession();
  const requested = params.get("volver") ?? "/";
  const returnTo = /^(\/|\/partidos\/(nuevo|[a-f0-9-]{36}))$/.test(requested)
    ? requested
    : "/";
  if (!ready) return <Loading />;
  if (person?.email)
    return <Navigate to={returnTo === "/" ? "/partidos" : returnTo} replace />;
  return (
    <section className="form-page">
      <div className="trial-access-notice" aria-labelledby="trial-access-title">
        <p className="eyebrow">EN DESARROLLO</p>
        <h1 id="trial-access-title">Acceso de prueba.</h1>
        <p>
          La aplicación todavía no está abierta al público. Este acceso está
          destinado a las cuentas habilitadas para pruebas.
        </p>
      </div>
      <LoginForm returnTo={returnTo} />
    </section>
  );
}
