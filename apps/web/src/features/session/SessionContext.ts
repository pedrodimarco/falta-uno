import { createContext } from "react";
import type { SessionPerson, VerifyLoginResponse } from "@falta-uno/contracts";
export interface SessionContextValue {
  person: SessionPerson | null;
  ready: boolean;
  localMail: boolean;
  verify: (token: string) => Promise<VerifyLoginResponse>;
  logout: () => Promise<void>;
}
export const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);
