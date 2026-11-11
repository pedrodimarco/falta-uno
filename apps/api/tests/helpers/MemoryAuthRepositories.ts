import type { Person, SessionPerson } from "../../src/models/Person.ts";
import type {
  SessionRecord,
  SessionRepository,
} from "../../src/repositories/interfaces/SessionRepository.ts";
import type { LoginLinkRepository } from "../../src/repositories/interfaces/LoginLinkRepository.ts";
import type { LoginLink } from "../../src/models/LoginLink.ts";
export class MemorySessionRepository implements SessionRepository {
  people = new Map<string, Person>();
  accounts = new Map<string, string>();
  sessions = new Map<string, SessionRecord>();
  findPerson(hash: string, now: number): SessionPerson | null {
    const session = this.sessions.get(hash);
    if (!session || session.expiresAt <= now) return null;
    const person = this.people.get(session.personId);
    if (!person) return null;
    const email =
      [...this.accounts].find(([, id]) => id === person.id)?.[0] ?? null;
    return { ...person, email };
  }
  findAccount(email: string) {
    const id = this.accounts.get(email);
    return id ? (this.people.get(id) ?? null) : null;
  }
  hasAccount(id: string) {
    return [...this.accounts.values()].includes(id);
  }
  insertPerson(person: Person) {
    this.people.set(person.id, person);
  }
  insertAccount(email: string, id: string) {
    this.accounts.set(email, id);
  }
  insertSession(session: SessionRecord) {
    this.sessions.set(session.tokenHash, session);
  }
  revokeSession(hash: string) {
    this.sessions.delete(hash);
  }
  revokePersonSessions(id: string) {
    for (const [hash, session] of this.sessions)
      if (session.personId === id) this.sessions.delete(hash);
  }
  mergeLegacyPerson(id: string, _account: string) {
    this.revokePersonSessions(id);
  }
}
export class MemoryLoginLinkRepository implements LoginLinkRepository {
  links = new Map<string, LoginLink>();
  requests: { emailHash: string; ipHash: string; createdAt: number }[] = [];
  insert(link: LoginLink) {
    this.links.set(link.tokenHash, { ...link });
  }
  find(hash: string) {
    const link = this.links.get(hash);
    return link ? { ...link } : null;
  }
  consume(hash: string, now: number) {
    const link = this.links.get(hash);
    if (!link || link.consumedAt !== null || link.expiresAt <= now)
      return false;
    link.consumedAt = now;
    return true;
  }
  remove(hash: string) {
    this.links.delete(hash);
  }
  countForEmail(hash: string, since: number) {
    return this.requests.filter(
      (r) => r.emailHash === hash && r.createdAt > since,
    ).length;
  }
  countForIp(hash: string, since: number) {
    return this.requests.filter((r) => r.ipHash === hash && r.createdAt > since)
      .length;
  }
  recordRequest(emailHash: string, ipHash: string, now: number) {
    this.requests.push({ emailHash, ipHash, createdAt: now });
  }
  cleanup(now: number) {
    this.requests = this.requests.filter((r) => r.createdAt >= now - 3_600_000);
  }
}
