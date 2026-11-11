import type { LoginLink } from "../../models/LoginLink.ts";

export interface LoginLinkRepository {
  insert(link: LoginLink): void;
  find(tokenHash: string): LoginLink | null;
  consume(tokenHash: string, now: number): boolean;
  remove(tokenHash: string): void;
  countForEmail(emailHash: string, since: number): number;
  countForIp(ipHash: string, since: number): number;
  recordRequest(emailHash: string, ipHash: string, now: number): void;
  cleanup(now: number): void;
}
