import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchDetail } from "@falta-uno/contracts";
import {
  getMatch,
  confirmParticipation,
  cancelParticipation,
  joinWaitlist,
  leaveWaitlist,
  acceptOffer,
  declineOffer,
} from "../api";
import { useSession } from "../../session/useSession";
import { ApiError } from "../../../shared/api/http";
import { getErrorMessage } from "../../../shared/utils/errors";

const REFRESH_INTERVAL_MS = 15_000;

export function useMatch(id: string) {
  const { person } = useSession();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pending, setPending] = useState(false);
  const revision = useRef(0);
  const working = useRef(false);

  const load = useCallback(async () => {
    if (working.current) return;
    const request = ++revision.current;
    const data = await getMatch(id);
    // Una respuesta vieja no debe pisar una confirmación o una ruta nueva.
    if (request === revision.current) setMatch(data);
  }, [id]);

  useEffect(() => {
    let active = true;
    working.current = false;
    setPending(false);
    setLoading(true);
    setError("");
    setActionError("");
    setMatch(null);
    load()
      .catch((error) => {
        if (active) setError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      revision.current++;
    };
  }, [load]);

  useEffect(() => {
    const update = () => {
      // Conservar el detalle visible si falla una actualización en segundo plano.
      void load().catch(() => {});
    };
    const timer = window.setInterval(update, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, [load]);

  async function reload() {
    setLoading(true);
    setError("");
    try {
      await load();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function runAction(operation: () => Promise<MatchDetail>) {
    if (working.current) return false;
    working.current = true;
    const request = ++revision.current;
    setPending(true);
    setActionError("");

    try {
      if (!person?.email)
        throw new Error("Ingresá con tu correo para confirmar tu lugar.");
      const updated = await operation();
      if (request !== revision.current) return false;
      setMatch(updated);
      return true;
    } catch (error) {
      if (request !== revision.current) return false;
      setActionError(getErrorMessage(error));
      // Si otro jugador tomó el último cupo, volver a consultar el estado real.
      if (
        error instanceof ApiError &&
        (error.status === 409 || error.status === 404)
      ) {
        working.current = false;
        await load().catch(() => {});
      }
      return false;
    } finally {
      if (request === revision.current || working.current === false) {
        working.current = false;
        setPending(false);
      }
    }
  }

  return {
    match,
    loading,
    error,
    pending,
    actionError,
    reload,
    confirm: () => runAction(() => confirmParticipation(id)),
    cancel: () => runAction(() => cancelParticipation(id)),
    joinWaitlist: () => runAction(() => joinWaitlist(id)),
    leaveWaitlist: () => runAction(() => leaveWaitlist(id)),
    acceptOffer: (offerId: string) => runAction(() => acceptOffer(id, offerId)),
    declineOffer: (offerId: string) =>
      runAction(() => declineOffer(id, offerId)),
  };
}
