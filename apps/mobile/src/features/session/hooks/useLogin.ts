import { useEffect, useState } from "react";
import { requestLoginInput } from "@busco/contracts";
import { useSession } from "../SessionContext";
import { requestLink } from "../api";
import { credentials } from "../../../shared/storage/credentials";
import { errorMessage } from "../../../shared/utils/errors";
import { loginToken } from "../loginLink";

export function useLogin() {
  const session = useSession();
  const [flow, setFlow] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [localMail, setLocalMail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void credentials
      .get("flow")
      .then(setFlow)
      .catch((error) => setError(errorMessage(error)))
      .finally(() => setInitializing(false));
  }, []);
  async function request(name: string, email: string) {
    setBusy(true);
    setError("");
    try {
      const parsed = requestLoginInput.safeParse({ name, email });
      if (!parsed.success)
        throw new Error(
          "Ingresá un nombre de al menos dos caracteres y un correo válido.",
        );
      const result = await requestLink(parsed.data.name, parsed.data.email);
      await credentials.set("flow", result.flowToken);
      setLocalMail(result.localMail);
      setFlow(result.flowToken);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function verify(link: string) {
    if (!flow) return false;
    setBusy(true);
    setError("");
    try {
      await session.completeLogin(loginToken(link), flow);
      return true;
    } catch (error) {
      setError(errorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    try {
      await credentials.remove("flow");
      setFlow(null);
      setError("");
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  return { flow, initializing, localMail, busy, error, request, verify, reset };
}
