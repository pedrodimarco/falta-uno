import { useState } from "react";
import type {
  AddMatchPlayerInput,
  MatchDetail,
  UpdateMatchInput,
} from "@falta-uno/contracts";
import {
  Body,
  Button,
  Card,
  Label,
  Notice,
} from "../../../shared/components/ui";
import { AddPlayerForm } from "./AddPlayerForm";
import { MatchEditor } from "./MatchEditor";
export function MatchManagement({
  match,
  pending,
  error,
  onUpdate,
  onAdd,
  onRemove,
}: {
  match: MatchDetail;
  pending: boolean;
  error: string;
  onUpdate: (input: UpdateMatchInput) => Promise<boolean>;
  onAdd: (input: AddMatchPlayerInput) => Promise<boolean>;
  onRemove: (personId: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<MatchDetail | null>(null);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(
    null,
  );
  if (!match.isOrganizer) return null;
  if (match.closed)
    return (
      <Card>
        <Label>Administrar partido</Label>
        <Body>El partido ya comenzó. La gestión está cerrada.</Body>
      </Card>
    );
  return (
    <Card>
      <Label>Administrar partido</Label>
      <Body>
        Podés editar los datos y gestionar jugadores hasta el inicio. Se
        conserva el orden de espera.
      </Body>
      {editing ? (
        <>
          <MatchEditor
            key={`${editing.id}:${editing.version}`}
            initial={editing}
            pending={pending}
            onSave={async (input) => {
              const saved = await onUpdate(input);
              if (saved) setEditing(null);
              return saved;
            }}
            onCancel={() => setEditing(null)}
          />
          {editing.version !== match.version && (
            <Button
              title="Cargar la última versión"
              secondary
              disabled={pending}
              onPress={() => setEditing(match)}
            />
          )}
        </>
      ) : (
        <Button
          title="Editar datos"
          disabled={pending || match.version === undefined}
          onPress={() => setEditing(match)}
        />
      )}
      <AddPlayerForm pending={pending} onAdd={onAdd} />
      <Label>Gestionar jugadores</Label>
      {match.players.map((player) => (
        <Card key={player.id}>
          <Body>
            {player.name}
            {player.isGuest ? " · invitado" : ""} · confirmado
          </Body>
          <Button
            title={`Quitar a ${player.name}`}
            secondary
            disabled={pending}
            onPress={() => setRemoving(player)}
          />
        </Card>
      ))}
      {match.waitingList.map((entry) => (
        <Card key={entry.person.id}>
          <Body>
            {entry.position}. {entry.person.name} ·{" "}
            {entry.status === "offered" ? "con oferta" : "en espera"}
          </Body>
          <Button
            title={`Quitar a ${entry.person.name}`}
            secondary
            disabled={pending}
            onPress={() => setRemoving(entry.person)}
          />
        </Card>
      ))}
      {removing && (
        <Card>
          <Body>
            ¿Quitar a {removing.name}? Si libera un lugar, se ofrecerá al
            primero en espera.
          </Body>
          <Button
            title="Confirmar baja"
            disabled={pending}
            onPress={() => {
              void onRemove(removing.id).then((saved) => {
                if (saved) setRemoving(null);
              });
            }}
          />
          <Button
            title="Conservar jugador"
            secondary
            disabled={pending}
            onPress={() => setRemoving(null)}
          />
        </Card>
      )}
      <Notice message={error} />
    </Card>
  );
}
