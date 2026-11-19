import { useState, type FormEvent } from "react";
import {
  editStartTime,
  formatLocalDateTime,
  priceToCents,
  updateMatchInput,
  type MatchDetail,
  type UpdateMatchInput,
} from "@falta-uno/contracts";
import { ErrorNotice } from "../../../shared/components/ErrorNotice";
import { getErrorMessage } from "../../../shared/utils/errors";

export function MatchEditor({
  initial,
  pending,
  onSave,
  onCancel,
}: {
  initial: MatchDetail;
  pending: boolean;
  onSave: (input: UpdateMatchInput) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const timeZone = String(form.get("timeZone")).trim();
      const parsed = updateMatchInput.safeParse({
        title: form.get("title"),
        sport: form.get("sport"),
        venue: form.get("venue"),
        startsAt: editStartTime(
          String(form.get("startsAt")),
          timeZone,
          initial,
        ),
        timeZone,
        capacity: Number(form.get("capacity")),
        price: priceToCents(String(form.get("price"))),
        currency: "UYU",
        notes: form.get("notes"),
        expectedVersion: initial.version,
      });
      if (!parsed.success)
        throw new Error("Revisá los datos del partido y la zona horaria.");
      await onSave(parsed.data);
    } catch (error) {
      setError(getErrorMessage(error));
    }
  }
  return (
    <form className="create-form" onSubmit={submit}>
      <fieldset disabled={pending} className="management-fields">
        <legend>Editar datos del partido</legend>
        <div className="form-row">
          <label>
            Deporte
            <select name="sport" defaultValue={initial.sport}>
              {["Fútbol 5", "Pádel", "Básquet", "Otro"].map((sport) => (
                <option key={sport}>{sport}</option>
              ))}
            </select>
          </label>
          <label>
            Cupos
            <input
              name="capacity"
              type="number"
              min={2}
              max={50}
              required
              defaultValue={initial.capacity}
            />
          </label>
        </div>
        <label>
          Nombre del partido
          <input
            name="title"
            minLength={3}
            maxLength={100}
            required
            defaultValue={initial.title}
          />
        </label>
        <label>
          Fecha y hora
          <input
            type="datetime-local"
            name="startsAt"
            required
            defaultValue={formatLocalDateTime(
              initial.startsAt,
              initial.timeZone,
            )}
          />
        </label>
        <label>
          Zona horaria
          <input
            name="timeZone"
            required
            maxLength={80}
            defaultValue={initial.timeZone}
          />
          <span className="help">
            La fecha y hora se interpretan en esta zona, por ejemplo
            America/Montevideo.
          </span>
        </label>
        <label>
          Cancha o lugar
          <input
            name="venue"
            minLength={2}
            maxLength={160}
            required
            defaultValue={initial.venue}
          />
        </label>
        <label>
          Costo por persona (UYU)
          <input
            name="price"
            type="number"
            min={0}
            max={1000000}
            step="0.01"
            defaultValue={initial.price === null ? "" : initial.price / 100}
          />
          <span className="help">Vacío: a confirmar. Cero: gratis.</span>
        </label>
        <label>
          Notas
          <textarea
            name="notes"
            maxLength={1000}
            rows={3}
            defaultValue={initial.notes}
          />
        </label>
        <p className="help">
          Se conservarán los jugadores y el orden de espera. Las reservas
          vigentes también cuentan para el mínimo de cupos.
        </p>
        <ErrorNotice message={error} />
        <button className="primary" type="submit">
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onCancel}>
          Volver sin guardar
        </button>
      </fieldset>
    </form>
  );
}
