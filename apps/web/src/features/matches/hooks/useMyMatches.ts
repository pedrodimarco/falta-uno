import { useEffect, useState } from "react";
import type { MatchSummary } from "@falta-uno/contracts";
import { getMyMatches } from "../api";
import { getErrorMessage } from "../../../shared/utils/errors";

export function useMyMatches(personId?: string) {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(Boolean(personId));
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!personId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getMyMatches(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setMatches(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(getErrorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [personId, revision]);

  const reload = () => setRevision((value) => value + 1);
  return { matches, loading, error, reload };
}
