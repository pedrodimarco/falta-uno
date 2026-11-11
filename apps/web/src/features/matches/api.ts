import type { MatchDetail, MatchInput, MatchSummary } from "@busco/contracts";
import { http } from "../../shared/api/http";

export function getMyMatches(signal?: AbortSignal) {
  return http<MatchSummary[]>("/matches", { signal });
}

export function getMatch(id: string, signal?: AbortSignal) {
  return http<MatchDetail>(`/matches/${encodeURIComponent(id)}`, { signal });
}

export function createMatch(input: MatchInput) {
  return http<MatchDetail>("/matches", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function confirmParticipation(id: string) {
  return http<MatchDetail>(`/matches/${encodeURIComponent(id)}/participation`, {
    method: "PUT",
  });
}

export function cancelParticipation(id: string) {
  return http<MatchDetail>(`/matches/${encodeURIComponent(id)}/participation`, {
    method: "DELETE",
  });
}

export function joinWaitlist(id: string) {
  return http<MatchDetail>(`/matches/${encodeURIComponent(id)}/waitlist`, {
    method: "PUT",
  });
}
export function leaveWaitlist(id: string) {
  return http<MatchDetail>(`/matches/${encodeURIComponent(id)}/waitlist`, {
    method: "DELETE",
  });
}
export function acceptOffer(id: string, offerId: string) {
  return http<MatchDetail>(
    `/matches/${encodeURIComponent(id)}/offers/${encodeURIComponent(offerId)}/accept`,
    { method: "POST" },
  );
}
export function declineOffer(id: string, offerId: string) {
  return http<MatchDetail>(
    `/matches/${encodeURIComponent(id)}/offers/${encodeURIComponent(offerId)}/decline`,
    { method: "POST" },
  );
}
