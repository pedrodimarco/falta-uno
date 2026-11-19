import { useState } from "react";
import {
  editStartTime,
  formatLocalDateTime,
  priceToCents,
  updateMatchInput,
  type MatchDetail,
  type MatchInput,
  type UpdateMatchInput,
} from "@falta-uno/contracts";
import {
  Body,
  Button,
  Choices,
  Field,
  Label,
  Notice,
} from "../../../shared/components/ui";
import { errorMessage } from "../../../shared/utils/errors";
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
  const local = formatLocalDateTime(initial.startsAt, initial.timeZone);
  const [draft, setDraft] = useState({
    sport: initial.sport as MatchInput["sport"],
    title: initial.title,
    venue: initial.venue,
    date: local.slice(0, 10),
    time: local.slice(11),
    timeZone: initial.timeZone,
    capacity: String(initial.capacity),
    price: initial.price === null ? "" : String(initial.price / 100),
    notes: initial.notes,
  });
  const [error, setError] = useState("");
  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function submit() {
    setError("");
    try {
      const parsed = updateMatchInput.safeParse({
        sport: draft.sport,
        title: draft.title,
        venue: draft.venue,
        timeZone: draft.timeZone.trim(),
        capacity: Number(draft.capacity),
        price: priceToCents(draft.price),
        currency: "UYU",
        notes: draft.notes,
        startsAt: editStartTime(
          `${draft.date}T${draft.time}`,
          draft.timeZone.trim(),
          initial,
        ),
        expectedVersion: initial.version,
      });
      if (!parsed.success)
        throw new Error("Revisá los datos del partido y la zona horaria.");
      await onSave(parsed.data);
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  return (
    <>
      <Label>Editar datos del partido</Label>
      <Choices
        values={["Fútbol 5", "Pádel", "Básquet", "Otro"] as const}
        value={draft.sport}
        onChange={(value) => {
          if (!pending) set("sport", value);
        }}
      />
      <Field
        label="Nombre del partido"
        value={draft.title}
        editable={!pending}
        onChangeText={(value) => set("title", value)}
        maxLength={100}
      />
      <Field
        label="Cancha o lugar"
        value={draft.venue}
        editable={!pending}
        onChangeText={(value) => set("venue", value)}
        maxLength={160}
      />
      <Field
        label="Fecha (AAAA-MM-DD)"
        value={draft.date}
        editable={!pending}
        onChangeText={(value) => set("date", value)}
        maxLength={10}
      />
      <Field
        label="Hora (HH:mm)"
        value={draft.time}
        editable={!pending}
        onChangeText={(value) => set("time", value)}
        maxLength={5}
      />
      <Field
        label="Zona horaria"
        value={draft.timeZone}
        editable={!pending}
        onChangeText={(value) => set("timeZone", value)}
        autoCapitalize="none"
        maxLength={80}
      />
      <Body>
        La fecha y hora se interpretan en esa zona. Se conservarán los jugadores
        y el orden de espera.
      </Body>
      <Field
        label="Cupos totales"
        value={draft.capacity}
        editable={!pending}
        onChangeText={(value) => set("capacity", value)}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Field
        label="Costo por persona (UYU)"
        value={draft.price}
        editable={!pending}
        onChangeText={(value) => set("price", value)}
        keyboardType="decimal-pad"
        maxLength={12}
        placeholder="A confirmar"
      />
      <Field
        label="Notas"
        value={draft.notes}
        editable={!pending}
        onChangeText={(value) => set("notes", value)}
        multiline
        maxLength={1000}
      />
      <Notice message={error} />
      <Button
        title={pending ? "Guardando…" : "Guardar cambios"}
        disabled={pending}
        onPress={() => {
          void submit();
        }}
      />
      <Button
        title="Volver sin guardar"
        secondary
        disabled={pending}
        onPress={onCancel}
      />
    </>
  );
}
