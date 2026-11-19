import { useRef, useState, type FormEvent } from "react";
import type { AddMatchPlayerInput } from "@falta-uno/contracts";
import { ErrorNotice } from "../../../shared/components/ErrorNotice";
import { getErrorMessage } from "../../../shared/utils/errors";
export function AddPlayerForm({
  pending,
  onAdd,
}: {
  pending: boolean;
  onAdd: (input: AddMatchPlayerInput) => Promise<boolean>;
}) {
  const [kind, setKind] = useState<"registered" | "guest">("registered");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const guestId = useRef<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const input: AddMatchPlayerInput =
        kind === "registered"
          ? { kind, email: value.trim().toLowerCase() }
          : {
              kind,
              name: value.trim(),
              guestId: (guestId.current ??= crypto.randomUUID()),
            };
      if (await onAdd(input)) {
        setValue("");
        guestId.current = null;
      }
    } catch (error) {
      setError(getErrorMessage(error));
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={pending} className="management-fields">
        <legend>Agregar jugador</legend>
        <label>
          Tipo de jugador
          <select
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as typeof kind);
              setValue("");
              guestId.current = null;
              setError("");
            }}
          >
            <option value="registered">Usuario registrado</option>
            <option value="guest">Invitado sin cuenta</option>
          </select>
        </label>
        <label>
          {kind === "registered" ? "Correo del usuario" : "Nombre del invitado"}
          <input
            type={kind === "registered" ? "email" : "text"}
            required
            minLength={kind === "guest" ? 2 : undefined}
            maxLength={kind === "guest" ? 60 : 254}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              guestId.current = null;
            }}
          />
        </label>
        <p className="help">
          El jugador se agregará como confirmado. Se respetan los lugares ya
          ofrecidos a la lista de espera.
        </p>
        <ErrorNotice message={error} />
        <button className="primary" type="submit">
          {pending ? "Procesando…" : "Agregar jugador"}
        </button>
      </fieldset>
    </form>
  );
}
