import type {
  MobileLoginRequestResponse,
  MobileLoginResponse,
  SessionResponse,
} from "@falta-uno/contracts";
import { http } from "../../shared/api/http";
export const getSession = () => http<SessionResponse>("/mobile/session");
export const requestLink = (name: string, email: string) =>
  http<MobileLoginRequestResponse>("/mobile/session/request-link", {
    method: "POST",
    body: JSON.stringify({ name, email, returnTo: "/" }),
  });
export const verifyLink = (token: string, flowToken: string) =>
  http<MobileLoginResponse>("/mobile/session/verify", {
    method: "POST",
    body: JSON.stringify({ token, flowToken }),
  });
export const logout = () => http<void>("/mobile/session", { method: "DELETE" });
