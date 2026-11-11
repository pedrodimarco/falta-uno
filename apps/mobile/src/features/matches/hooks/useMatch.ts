import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import type { MatchDetail } from "@falta-uno/contracts";
import { useSession } from "../../session/SessionContext";
import { getMatch } from "../api";
import { errorMessage } from "../../../shared/utils/errors";

export function useMatch(id: string) {
  const { person } = useSession();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const revision = useRef(0);
  const working = useRef(false);
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      focused.current = true;
      working.current = false;
      setPending(false);
      setMatch(null);
      setLoading(true);
      setError("");
      setActionError("");
      const load = async (initial = false) => {
        if (working.current || AppState.currentState === "background") return;
        const request = ++revision.current;
        try {
          const data = await getMatch(id);
          if (active && request === revision.current) {
            setMatch(data);
            setError("");
          }
        } catch (error) {
          if (active && request === revision.current)
            setError(errorMessage(error));
        } finally {
          if (active && initial) setLoading(false);
        }
      };
      void load(true);
      const timer = setInterval(() => {
        void load();
      }, 15_000);
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") void load();
      });
      return () => {
        active = false;
        focused.current = false;
        revision.current++;
        clearInterval(timer);
        listener.remove();
      };
    }, [id, person?.id, refreshKey]),
  );
  async function run(operation: () => Promise<MatchDetail>) {
    if (working.current || !focused.current) return;
    working.current = true;
    const request = ++revision.current;
    setPending(true);
    setActionError("");
    try {
      if (!person?.email)
        throw new Error("Ingresá con tu correo para participar.");
      const updated = await operation();
      if (request === revision.current) {
        setMatch(updated);
        setError("");
      }
    } catch (error) {
      if (request !== revision.current) return;
      setActionError(errorMessage(error));
      try {
        const updated = await getMatch(id);
        if (request === revision.current) setMatch(updated);
      } catch {
        /* Conservar datos y error de la acción para poder reintentar. */
      }
    } finally {
      if (request === revision.current) {
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
    run,
    reload: () => setRefreshKey((value) => value + 1),
  };
}
