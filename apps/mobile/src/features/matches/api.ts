import type { MatchDetail, MatchInput, MatchSummary } from "@busco/contracts";
import { http } from "../../shared/api/http";
const path = (id: string) => `/matches/${encodeURIComponent(id)}`;
export const getMyMatches = (signal?: AbortSignal) =>
  http<MatchSummary[]>("/matches", { signal });
export const getMatch = (id: string, signal?: AbortSignal) =>
  http<MatchDetail>(path(id), { signal });
export const createMatch = (input: MatchInput) =>
  http<MatchDetail>("/matches", {
    method: "POST",
    body: JSON.stringify(input),
  });
export const confirmParticipation = (id: string) =>
  http<MatchDetail>(`${path(id)}/participation`, { method: "PUT" });
export const cancelParticipation = (id: string) =>
  http<MatchDetail>(`${path(id)}/participation`, { method: "DELETE" });
export const joinWaitlist = (id: string) =>
  http<MatchDetail>(`${path(id)}/waitlist`, { method: "PUT" });
export const leaveWaitlist = (id: string) =>
  http<MatchDetail>(`${path(id)}/waitlist`, { method: "DELETE" });
export const acceptOffer = (id: string, offer: string) =>
  http<MatchDetail>(`${path(id)}/offers/${encodeURIComponent(offer)}/accept`, {
    method: "POST",
  });
export const declineOffer = (id: string, offer: string) =>
  http<MatchDetail>(`${path(id)}/offers/${encodeURIComponent(offer)}/decline`, {
    method: "POST",
  });
