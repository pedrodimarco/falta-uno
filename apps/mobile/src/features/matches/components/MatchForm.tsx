import { useState } from "react";
import { Switch, View } from "react-native";
import type { MatchDetail } from "@falta-uno/contracts";
import {
  Body,
  Button,
  Choices,
  Field,
  Label,
  Notice,
} from "../../../shared/components/ui";
import { buildMatchInput, type MatchDraft } from "../matchForm";
import { createMatch } from "../api";
import { errorMessage } from "../../../shared/utils/errors";

export function MatchForm({
  onCreated,
}: {
  onCreated: (match: MatchDetail) => void;
}) {
  const [draft, setDraft] = useState<MatchDraft>({
    sport: "Fútbol 5",
    title: "",
    date: "",
    time: "20:00",
    venue: "",
    capacity: "10",
    price: "",
    notes: "",
    organizerPlays: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof MatchDraft>(key: K, value: MatchDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  async function submit() {
    setBusy(true);
    setError("");
    try {
      onCreated(await createMatch(buildMatchInput(draft)));
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Label>Deporte</Label>
      <Choices
        values={["Fútbol 5", "Pádel", "Básquet", "Otro"] as const}
        value={draft.sport}
        onChange={(sport) => {
          set("sport", sport);
          set("capacity", sport === "Pádel" ? "4" : "10");
        }}
      />
      <Field
        label="Nombre del partido"
        value={draft.title}
        onChangeText={(text) => set("title", text)}
        maxLength={100}
        placeholder="Fútbol del jueves"
      />
      <Field
        label="Lugar"
        value={draft.venue}
        onChangeText={(text) => set("venue", text)}
        maxLength={160}
        placeholder="Club o dirección"
      />
      <Field
        label="Fecha (AAAA-MM-DD)"
        value={draft.date}
        onChangeText={(text) => set("date", text)}
        placeholder="2026-11-20"
        maxLength={10}
        autoCapitalize="none"
      />
      <Field
        label="Hora (HH:mm)"
        value={draft.time}
        onChangeText={(text) => set("time", text)}
        placeholder="20:00"
        maxLength={5}
      />
      <Body>
        La fecha y hora usan la zona del teléfono:{" "}
        {Intl.DateTimeFormat().resolvedOptions().timeZone}.
      </Body>
      <Field
        label="Cupos totales"
        value={draft.capacity}
        onChangeText={(text) => set("capacity", text)}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Field
        label="Costo por persona (UYU, opcional)"
        value={draft.price}
        onChangeText={(text) => set("price", text)}
        keyboardType="decimal-pad"
        placeholder="A confirmar"
        maxLength={12}
      />
      <Field
        label="Notas (opcional)"
        value={draft.notes}
        onChangeText={(text) => set("notes", text)}
        multiline
        maxLength={1000}
        placeholder="Qué llevar, cómo llegar…"
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Label>Yo también juego</Label>
        <Switch
          accessibilityLabel="Yo también juego"
          value={draft.organizerPlays}
          onValueChange={(value) => set("organizerPlays", value)}
        />
      </View>
      <Notice message={error} />
      <Button
        title={busy ? "Creando…" : "Crear partido"}
        disabled={busy}
        onPress={() => {
          void submit();
        }}
      />
    </>
  );
}
