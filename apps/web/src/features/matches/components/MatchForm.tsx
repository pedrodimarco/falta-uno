import { useState, type FormEvent } from "react";
import type { MatchInput } from "@busco/contracts";
import { ErrorNotice } from "../../../shared/components/ErrorNotice";
import { buildMatchInput } from "../matchForm";
import { getErrorMessage } from "../../../shared/utils/errors";

type MatchFormProps = {
  sessionReady: boolean;
  pending: boolean;
  error: string;
  onSubmit: (input: MatchInput) => Promise<void>;
};

export function MatchForm({
  sessionReady,
  pending,
  error: serverError,
  onSubmit,
}: MatchFormProps) {
  const [sport, setSport] = useState<MatchInput["sport"]>("Fútbol 5");
  const [capacity, setCapacity] = useState(10);
  const [validationError, setValidationError] = useState("");
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const error = validationError || serverError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    try {
      const input = buildMatchInput(new FormData(event.currentTarget), {
        sport,
        capacity,
        timeZone,
      });
      await onSubmit(input);
    } catch (error) {
      setValidationError(getErrorMessage(error));
    }
  }

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Deporte
          <select
            value={sport}
            onChange={(e) => {
              const value = e.target.value as MatchInput["sport"];
              setSport(value);
              setCapacity(value === "Pádel" ? 4 : 10);
            }}
          >
            {["Fútbol 5", "Pádel", "Básquet", "Otro"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Cupos
          <input
            type="number"
            min={2}
            max={50}
            required
            value={capacity}
            onChange={(e) => setCapacity(e.target.valueAsNumber)}
          />
        </label>
      </div>
      <label>
        Nombre del partido
        <input
          name="title"
          required
          minLength={3}
          maxLength={100}
          placeholder="El fútbol del jueves"
        />
      </label>
      <label>
        Fecha y hora
        <input type="datetime-local" name="startsAt" required />
        <span className="help">Hora de tu dispositivo · {timeZone}</span>
      </label>
      <label>
        Cancha o lugar
        <input
          name="venue"
          required
          minLength={2}
          maxLength={160}
          placeholder="Nombre y dirección de la cancha"
        />
      </label>
      <label>
        Costo por persona (UYU)
        <input
          name="price"
          type="number"
          min={0}
          step="0.01"
          max={1000000}
          placeholder="A confirmar"
        />
        <span className="help">
          Dejá vacío si todavía no sabés. Ingresá 0 si es gratis.
        </span>
      </label>
      <label>
        Notas <span className="optional">· opcional</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={1000}
          placeholder="Llevá una remera clara y otra oscura."
        />
      </label>
      <label className="checkbox">
        <input type="checkbox" name="organizerPlays" defaultChecked />
        Yo también juego y ocupo un lugar.
      </label>
      <ErrorNotice message={error} />
      <button className="primary" disabled={pending || !sessionReady}>
        {pending ? "Creando partido…" : "Crear partido y obtener enlace ↗"}
      </button>
    </form>
  );
}
