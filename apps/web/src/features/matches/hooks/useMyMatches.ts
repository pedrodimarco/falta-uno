import { useEffect, useState } from "react";
import type { MatchSummary } from "@falta-uno/contracts";
import { getMyMatches } from "../api";
import { getErrorMessage } from "../../../shared/utils/errors";

function emptyState(personId?: string) {
  return {
    personId,
    matches: [] as MatchSummary[],
    loading: Boolean(personId),
    error: "",
  };
}

export function useMyMatches(personId?: string) {
  const [state, setState] = useState(() => emptyState(personId));
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setState(emptyState(personId));
    if (!personId) return;
    const controller = new AbortController();
    getMyMatches(controller.signal)
      .then((matches) => {
        if (!controller.signal.aborted) {
          setState({ personId, matches, loading: false, error: "" });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({
            personId,
            matches: [],
            loading: false,
            error: getErrorMessage(error),
          });
        }
      });
    return () => controller.abort();
  }, [personId, revision]);

  const visible = state.personId === personId ? state : emptyState(personId);
  const reload = () => setRevision((value) => value + 1);
  return {
    matches: visible.matches,
    loading: visible.loading,
    error: visible.error,
    reload,
  };
}
