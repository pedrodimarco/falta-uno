import { useState } from "react";
import type {
  AddMatchPlayerInput,
  MatchDetail,
  UpdateMatchInput,
} from "@falta-uno/contracts";
import { MatchEditor } from "./MatchEditor";
import { AddPlayerForm } from "./AddPlayerForm";
import { ErrorNotice } from "../../../shared/components/ErrorNotice";
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
  return (
    <section className="management-panel" aria-label="Administrar partido">
      <h2>Administrar partido</h2>
      {match.closed ? (
        <p>
          El partido ya comenzó. La edición y la gestión de jugadores están
          cerradas.
        </p>
      ) : (
        <>
          <p className="muted">
            Como organizador podés editar los datos y gestionar jugadores hasta
            el inicio. El orden de espera se conserva.
          </p>
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
                <p className="help">
                  Hay una versión más reciente del partido.{" "}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setEditing(match)}
                  >
                    Cargar la última versión
                  </button>
                </p>
              )}
            </>
          ) : (
            <button
              disabled={pending || match.version === undefined}
              onClick={() => setEditing(match)}
            >
              Editar datos
            </button>
          )}
          <AddPlayerForm pending={pending} onAdd={onAdd} />
          <h3>Gestionar jugadores</h3>
          <ul className="management-roster">
            {match.players.map((player) => (
              <li key={player.id}>
                <span>
                  {player.name}
                  {player.isGuest ? " · invitado" : ""} · confirmado
                </span>
                <button disabled={pending} onClick={() => setRemoving(player)}>
                  Quitar a {player.name}
                </button>
              </li>
            ))}
            {match.waitingList.map((entry) => (
              <li key={entry.person.id}>
                <span>
                  {entry.position}. {entry.person.name} ·{" "}
                  {entry.status === "offered" ? "con oferta" : "en espera"}
                </span>
                <button
                  disabled={pending}
                  onClick={() => setRemoving(entry.person)}
                >
                  Quitar a {entry.person.name}
                </button>
              </li>
            ))}
          </ul>
          {removing && (
            <div
              className="cancel-confirm"
              role="group"
              aria-label="Confirmar baja"
            >
              <p>
                ¿Quitar a {removing.name} del encuentro? Si libera un cupo, se
                ofrecerá al primero en espera.
              </p>
              <button
                className="danger"
                disabled={pending}
                onClick={async () => {
                  if (await onRemove(removing.id)) setRemoving(null);
                }}
              >
                Confirmar baja
              </button>
              <button disabled={pending} onClick={() => setRemoving(null)}>
                Conservar jugador
              </button>
            </div>
          )}
          <ErrorNotice message={error} />
        </>
      )}
    </section>
  );
}
