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
  if (person?.email) return <Navigate to={returnTo} replace />;
  return (
    <section className="form-page">
      <LoginForm returnTo={returnTo} />
    </section>
  );
}
