import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { SessionPerson } from "@falta-uno/contracts";
import { SessionContext } from "./SessionContext";
import * as api from "./api";
import { credentials } from "../../shared/storage/credentials";
import { setSessionExpiredHandler } from "../../shared/api/http";
import { errorMessage } from "../../shared/utils/errors";

export function SessionProvider({ children }: PropsWithChildren) {
  const [person, setPerson] = useState<SessionPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!(await credentials.get("session"))) {
        setPerson(null);
        return;
      }
      const session = await api.getSession();
      if (!session.person) await credentials.remove("session");
      setPerson(session.person);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    setSessionExpiredHandler(() => setPerson(null));
    void refresh();
    return () => setSessionExpiredHandler(() => {});
  }, [refresh]);
  async function completeLogin(token: string, flow: string) {
    const result = await api.verifyLink(token, flow);
    await credentials.set("session", result.token);
    await credentials.remove("flow");
    setPerson(result.person);
    setError("");
  }
  async function signOut() {
    // Si la revocación falla, se conserva la sesión para permitir reintentar.
    await api.logout();
    await credentials.remove("session");
    await credentials.remove("flow");
    setPerson(null);
  }
  return (
    <SessionContext.Provider
      value={{ person, loading, error, refresh, completeLogin, signOut }}
    >
      {children}
    </SessionContext.Provider>
  );
}
