import type { SessionResponse, VerifyLoginResponse } from "@busco/contracts";
import { http } from "../../shared/api/http";
export const getSession = (signal?: AbortSignal) =>
  http<SessionResponse>("/session", { signal });
export function requestLoginLink(
  name: string,
  email: string,
  returnTo: string,
) {
  return http<{ message: string; localMail: boolean }>(
    "/session/request-link",
    { method: "POST", body: JSON.stringify({ name, email, returnTo }) },
  );
}
export const verifyLoginLink = (token: string) =>
  http<VerifyLoginResponse>("/session/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
export const endSession = () => http<void>("/session", { method: "DELETE" });
