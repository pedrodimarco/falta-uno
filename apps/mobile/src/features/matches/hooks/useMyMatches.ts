import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import type { MatchSummary } from "@busco/contracts";
import { useSession } from "../../session/SessionContext";
import { getMyMatches } from "../api";
import { errorMessage } from "../../../shared/utils/errors";

export function useMyMatches() {
  const { person } = useSession();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setError("");
      setMatches([]);
      if (!person) {
        setLoading(false);
        return;
      }
      setLoading(true);
      void getMyMatches(controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setMatches(data);
        })
        .catch((error) => {
          if (!controller.signal.aborted) setError(errorMessage(error));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
    }, [person?.id, refreshKey]),
  );
  return {
    matches,
    loading,
    error,
    reload: () => setRefreshKey((value) => value + 1),
  };
}
