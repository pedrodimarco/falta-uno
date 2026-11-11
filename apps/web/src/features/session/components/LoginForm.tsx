import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "../useSession";
import { requestLoginLink } from "../api";
import { NameField } from "./NameField";
import { ErrorNotice } from "../../../shared/components/ErrorNotice";
import { getErrorMessage } from "../../../shared/utils/errors";

export function LoginForm({ returnTo = "/" }: { returnTo?: string }) {
  const { person, ready } = useSession();
  const [name, setName] = useState(person?.name ?? "");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [localMail, setLocalMail] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!retryAt) return;
    const update = () =>
      setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await requestLoginLink(name, email, returnTo);
      setSent(true);
      setLocalMail(result.localMail);
      setRetryAt(Date.now() + 60_000);
      setSeconds(60);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="login-form">
      <h2>{sent ? "Revisá tu correo" : "Entrá para organizar y jugar"}</h2>
      {person && !person.email && (
        <p className="auth-notice">
          Vinculá esta sesión a tu correo para conservar tus partidos y acceder
          desde otros dispositivos.
        </p>
      )}
      <p className="muted">
        Te mandamos un enlace de acceso. No necesitás contraseña.
      </p>
      <NameField name={name} onNameChange={setName} />
      <label>
        Tu correo
        <input
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSent(false);
          }}
          placeholder="vos@ejemplo.com"
        />
      </label>
      {sent && (
        <div className="auth-notice" role="status">
          <p>
            {localMail
              ? "Se generó un correo de prueba. No se envió a tu casilla."
              : `Enviamos el enlace a ${email}. Revisá también la carpeta de spam.`}
          </p>
          <p>
            Abrilo en este navegador. Vence en 10 minutos y se usa una sola vez.
          </p>
          {localMail && (
            <p>
              Para leerlo, ejecutá <code>npm run mail:latest</code> en el
              proyecto.
            </p>
          )}
        </div>
      )}
      <ErrorNotice message={error} />
      <button className="primary" disabled={pending || !ready || seconds > 0}>
        {pending
          ? "Preparando enlace…"
          : seconds > 0
            ? `Podés pedir otro en ${seconds}s`
            : sent
              ? "Pedir otro enlace"
              : "Recibir enlace de acceso"}
      </button>
      <p className="help">
        Tu nombre se utiliza al crear la cuenta. Una cuenta existente conserva
        su nombre.
      </p>
    </form>
  );
}
