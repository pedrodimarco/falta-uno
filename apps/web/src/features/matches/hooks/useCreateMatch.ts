import { useRef, useState } from "react";
import type { MatchInput } from "@falta-uno/contracts";
import { useSession } from "../../session/useSession";
import { createMatch } from "../api";
import { getErrorMessage } from "../../../shared/utils/errors";

export function useCreateMatch() {
  const { person } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const working = useRef(false);

  async function create(input: MatchInput) {
    if (working.current) return null;
    working.current = true;
    setPending(true);
    setError("");
    try {
      if (!person?.email)
        throw new Error("Ingresá con tu correo para crear el partido.");
      return await createMatch(input);
    } catch (error) {
      setError(getErrorMessage(error));
      return null;
    } finally {
      working.current = false;
      setPending(false);
    }
  }

  return { create, pending, error };
}
