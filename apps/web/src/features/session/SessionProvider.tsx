import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SessionPerson } from "@busco/contracts";
import { getSession, verifyLoginLink, endSession } from "./api";
import { SessionContext } from "./SessionContext";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [person, setPerson] = useState<SessionPerson | null>(null);
  const [ready, setReady] = useState(false);
  const [localMail, setLocalMail] = useState(false);
  
  useEffect(() => {
    const controller = new AbortController();
    getSession(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setPerson(data.person);
          setLocalMail(data.localMail);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setReady(true);
      });
    return () => controller.abort();
  }, []);

  const verify = useCallback(async (token: string) => {
    const result = await verifyLoginLink(token);
    setPerson(result.person);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await endSession();
    setPerson(null);
  }, []);

  const value = useMemo(
    () => ({ person, ready, localMail, verify, logout }),
    [person, ready, localMail, verify, logout],
  );
  
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
