import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AddMatchPlayerInput,
  MatchDetail,
  UpdateMatchInput,
} from "@falta-uno/contracts";
import {
  getMatch,
  confirmParticipation,
  cancelParticipation,
  joinWaitlist,
  leaveWaitlist,
  acceptOffer,
  declineOffer,
  updateMatch,
  addMatchPlayer,
  removeMatchPlayer,
} from "../api";
import { useSession } from "../../session/useSession";
import { ApiError } from "../../../shared/api/http";
import { getErrorMessage } from "../../../shared/utils/errors";

const REFRESH_INTERVAL_MS = 15_000;
type MatchScope = { id: string; personId: string | undefined };

function emptyState(scope: MatchScope) {
  return {
    scope,
    match: null as MatchDetail | null,
    loading: true,
    error: "",
    actionError: "",
    pending: false,
  };
}

interface RequestContext {
  scope: MatchScope;
  active: boolean;
  revision: number;
  working: boolean;
  controller: AbortController | null;
}

export function useMatch(id: string) {
  const { person } = useSession();
  const personId = person?.id;
  const scope = useMemo(() => ({ id, personId }), [id, personId]);
  const [state, setState] = useState(() => emptyState(scope));
  const context = useRef<RequestContext | null>(null);

  const load = useCallback(
    async (showLoading = false) => {
      const owner = context.current;
      if (!owner?.active || owner.scope !== scope || owner.working) return;
      owner.controller?.abort();
      const controller = new AbortController();
      owner.controller = controller;
      const request = ++owner.revision;
      if (showLoading) {
        setState((current) =>
          owner.active && current.scope === scope
            ? { ...current, loading: true, error: "" }
            : current,
        );
      }
      try {
        const match = await getMatch(scope.id, controller.signal);
        if (
          owner.active &&
          request === owner.revision &&
          !controller.signal.aborted
        ) {
          setState((current) =>
            owner.active && current.scope === scope
              ? { ...current, match, loading: false, error: "" }
              : current,
          );
        }
      } catch (error) {
        if (
          owner.active &&
          request === owner.revision &&
          !controller.signal.aborted
        ) {
          // Un fallo en segundo plano conserva el detalle que ya está visible.
          setState((current) =>
            owner.active &&
            current.scope === scope &&
            (showLoading || !current.match)
              ? { ...current, loading: false, error: getErrorMessage(error) }
              : current,
          );
        }
      }
    },
    [scope],
  );

  useEffect(() => {
    const owner: RequestContext = {
      scope,
      active: true,
      revision: 0,
      working: false,
      controller: null,
    };
    context.current = owner;
    setState(emptyState(scope));
    void load();
    return () => {
      // Las acciones no se deshacen al salir: solo se descarta su respuesta.
      owner.active = false;
      owner.controller?.abort();
    };
  }, [scope, load]);

  useEffect(() => {
    const update = () => {
      void load();
    };
    const timer = window.setInterval(update, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, [load]);

  async function runAction(operation: () => Promise<MatchDetail>) {
    const owner = context.current;
    if (!owner?.active || owner.scope !== scope || owner.working) return false;
    owner.working = true;
    owner.controller?.abort();
    const request = ++owner.revision;
    setState((current) =>
      owner.active && current.scope === scope
        ? { ...current, pending: true, actionError: "" }
        : current,
    );

    try {
      if (!person?.email)
        throw new Error("Ingresá con tu correo para confirmar tu lugar.");
      const match = await operation();
      if (!owner.active || request !== owner.revision) return false;
      setState((current) =>
        owner.active && current.scope === scope
          ? { ...current, match, loading: false, error: "" }
          : current,
      );
      return true;
    } catch (error) {
      if (!owner.active || request !== owner.revision) return false;
      setState((current) =>
        owner.active && current.scope === scope
          ? { ...current, actionError: getErrorMessage(error) }
          : current,
      );
      // Si otro jugador tomó el último cupo, consultar el estado real.
      if (
        error instanceof ApiError &&
        (error.status === 409 || error.status === 404)
      ) {
        owner.working = false;
        await load();
      }
      return false;
    } finally {
      if (owner.active && (request === owner.revision || !owner.working)) {
        owner.working = false;
        setState((current) =>
          owner.active && current.scope === scope
            ? { ...current, pending: false }
            : current,
        );
      }
    }
  }

  // Ocultar datos de otra identidad incluso antes de ejecutar los efectos.
  const visible = state.scope === scope ? state : emptyState(scope);
  return {
    match: visible.match,
    loading: visible.loading,
    error: visible.error,
    pending: visible.pending,
    actionError: visible.actionError,
    reload: () => load(true),
    update: (input: UpdateMatchInput) =>
      runAction(() => updateMatch(id, input)),
    addPlayer: (input: AddMatchPlayerInput) =>
      runAction(() => addMatchPlayer(id, input)),
    removePlayer: (personId: string) =>
      runAction(() => removeMatchPlayer(id, personId)),
    confirm: () => runAction(() => confirmParticipation(id)),
    cancel: () => runAction(() => cancelParticipation(id)),
    joinWaitlist: () => runAction(() => joinWaitlist(id)),
    leaveWaitlist: () => runAction(() => leaveWaitlist(id)),
    acceptOffer: (offerId: string) => runAction(() => acceptOffer(id, offerId)),
    declineOffer: (offerId: string) =>
      runAction(() => declineOffer(id, offerId)),
  };
}
