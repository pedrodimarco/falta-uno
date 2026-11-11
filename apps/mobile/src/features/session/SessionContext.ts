import { createContext, useContext } from "react";
import type { SessionPerson } from "@falta-uno/contracts";
interface SessionContextValue {
  person: SessionPerson | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  completeLogin: (token: string, flow: string) => Promise<void>;
  signOut: () => Promise<void>;
}
export const SessionContext = createContext<SessionContextValue | null>(null);
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("Falta SessionProvider.");
  return context;
}
