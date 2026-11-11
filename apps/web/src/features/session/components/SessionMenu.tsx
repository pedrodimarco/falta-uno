import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../useSession";
import { ErrorNotice } from "../../../shared/components/ErrorNotice";
import { getErrorMessage } from "../../../shared/utils/errors";
export function SessionMenu() {
  const { person, logout, ready } = useSession();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function leave() {
    setPending(true);
    setError("");
    try {
      await logout();
      navigate("/");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }
  if (!ready) return null;
  if (!person?.email) return <Link to="/ingresar">Ingresar</Link>;
  return (
    <div className="session-menu">
      <button className="text-button" disabled={pending} onClick={leave}>
        {pending ? "Saliendo…" : "Cerrar sesión"}
      </button>
      <ErrorNotice message={error} />
    </div>
  );
}
