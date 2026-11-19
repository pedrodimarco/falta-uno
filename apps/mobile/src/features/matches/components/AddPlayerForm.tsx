import { useRef, useState } from "react";
import { randomUUID } from "expo-crypto";
import type { AddMatchPlayerInput } from "@falta-uno/contracts";
import {
  Body,
  Button,
  Choices,
  Field,
  Label,
  Notice,
} from "../../../shared/components/ui";
import { errorMessage } from "../../../shared/utils/errors";
export function AddPlayerForm({
  pending,
  onAdd,
}: {
  pending: boolean;
  onAdd: (input: AddMatchPlayerInput) => Promise<boolean>;
}) {
  const [kind, setKind] = useState<
    "Usuario registrado" | "Invitado sin cuenta"
  >("Usuario registrado");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const guestId = useRef<string | null>(null);
  const registered = kind === "Usuario registrado";
  async function submit() {
    setError("");
    try {
      if (value.trim().length < 2)
        throw new Error("Ingresá los datos del jugador.");
      const input: AddMatchPlayerInput = registered
        ? { kind: "registered", email: value.trim().toLowerCase() }
        : {
            kind: "guest",
            name: value.trim(),
            guestId: (guestId.current ??= randomUUID()),
          };
      if (await onAdd(input)) {
        setValue("");
        guestId.current = null;
      }
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  return (
    <>
      <Label>Agregar jugador</Label>
      <Choices
        values={["Usuario registrado", "Invitado sin cuenta"] as const}
        value={kind}
        onChange={(value) => {
          if (!pending) {
            setKind(value);
            setValue("");
            guestId.current = null;
          }
        }}
      />
      <Field
        label={registered ? "Correo del usuario" : "Nombre del invitado"}
        value={value}
        onChangeText={(value) => {
          setValue(value);
          guestId.current = null;
        }}
        editable={!pending}
        autoCapitalize={registered ? "none" : "words"}
        autoCorrect={false}
        keyboardType={registered ? "email-address" : "default"}
        maxLength={registered ? 254 : 60}
      />
      <Body>
        Se agregará como confirmado, respetando los lugares ya ofrecidos a la
        lista de espera.
      </Body>
      <Notice message={error} />
      <Button
        title={pending ? "Procesando…" : "Agregar jugador"}
        disabled={pending}
        onPress={() => {
          void submit();
        }}
      />
    </>
  );
}
