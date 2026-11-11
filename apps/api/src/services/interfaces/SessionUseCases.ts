import type { SessionPerson } from "../../models/Person.ts";
export const SESSION_TTL_MS = 30 * 86_400_000;
export const LOGIN_LINK_TTL_MS = 10 * 60_000;
export interface RequestLoginCommand {
  name: string;
  email: string;
  returnTo: string;
  ip: string;
  existingToken?: string;
}
export interface SessionUseCases {
  readonly localMail: boolean;
  findPerson(token?: string): SessionPerson | null;
  requestLink(command: RequestLoginCommand): Promise<{ flowToken: string }>;
  verify(
    token: string,
    flowToken?: string,
    existingToken?: string,
  ): { person: SessionPerson; token: string; returnTo: string };
  logout(token?: string): void;
}
