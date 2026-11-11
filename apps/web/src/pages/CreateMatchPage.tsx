import { Link, useNavigate } from "react-router-dom";
import type { MatchInput } from "@busco/contracts";
import { useSession } from "../features/session/useSession";
import { useCreateMatch } from "../features/matches/hooks/useCreateMatch";
import { LoginForm } from "../features/session/components/LoginForm";
import { Loading } from "../shared/components/Loading";
import { MatchForm } from "../features/matches/components/MatchForm";

export function CreateMatchPage() {
  const navigate = useNavigate();
  const { person, ready } = useSession();
  const { create, pending, error } = useCreateMatch();

  async function handleSubmit(input: MatchInput) {
    const match = await create(input);
    if (match) navigate(`/partidos/${match.id}`);
  }

  return (
    <div className="form-page">
      <Link className="back" to="/">
        ← Mis partidos
      </Link>
      <header className="page-heading compact">
        <p className="eyebrow">PRIMER PASO: PONER FECHA</p>
        <h1>Armá el partido.</h1>
        <p className="muted">
          Después te damos el enlace para invitar a tus amigos.
        </p>
      </header>
      {!ready ? (
        <Loading />
      ) : !person?.email ? (
        <LoginForm returnTo="/partidos/nuevo" />
      ) : (
        <MatchForm
          sessionReady={ready}
          pending={pending}
          error={error}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
