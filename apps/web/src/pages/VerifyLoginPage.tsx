import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../features/session/useSession";
import { ErrorNotice } from "../shared/components/ErrorNotice";
import { ApiError } from "../shared/api/http";
import { getErrorMessage } from "../shared/utils/errors";

export function VerifyLoginPage() {
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "",
  );
  const { verify, ready } = useSession();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [linkRejected, setLinkRejected] = useState(false);
  const valid = /^[a-f0-9]{64}$/.test(token);
  useEffect(() => {
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
  }, []);
  async function confirm() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await verify(token);
      navigate(result.returnTo, { replace: true });
    } catch (error) {
      setError(getErrorMessage(error));
      setLinkRejected(
        error instanceof ApiError && error.code === "INVALID_LOGIN_LINK",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="form-page auth-confirm">
      <p className="eyebrow">ACCESO SIN CONTRASEÑA</p>
      <h1>
        {valid ? "Confirmá tu acceso." : "Necesitás un enlace de acceso."}
      </h1>
      <p>
        {valid
          ? "Al continuar verificamos tu correo y volvés a la pantalla donde estabas."
          : "Pedí un nuevo enlace o volvé a abrir el correo más reciente en el navegador donde lo solicitaste."}
      </p>
      <ErrorNotice message={error} />
      {valid && !linkRejected && (
        <button
          className="primary"
          disabled={pending || !ready}
          onClick={confirm}
        >
          {pending
            ? "Verificando…"
            : error
              ? "Volver a intentar"
              : "Confirmar acceso"}
        </button>
      )}
      <Link to="/ingresar">Pedir un nuevo enlace</Link>
    </section>
  );
}
