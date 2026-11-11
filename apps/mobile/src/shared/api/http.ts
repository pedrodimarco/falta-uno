import { environment } from "../../config/environment";
import { credentials } from "../storage/credentials";
import { createHttpClient } from "./createHttpClient";

let sessionExpired: () => void = () => {};
export function setSessionExpiredHandler(handler: () => void) {
  sessionExpired = handler;
}
export const http = createHttpClient({
  baseUrl: environment.apiUrl,
  getToken: () => credentials.get("session"),
  onUnauthorized: async (token) => {
    if ((await credentials.get("session")) !== token) return;
    await credentials.remove("session");
    sessionExpired();
  },
});
