import type { SessionRepository } from "../repositories/interfaces/SessionRepository.ts";
import type { LoginLinkRepository } from "../repositories/interfaces/LoginLinkRepository.ts";
import type {
  Clock,
  IdGenerator,
  SessionTokens,
  TransactionManager,
} from "./interfaces/dependencies.ts";
import type { MagicLinkMailer } from "./interfaces/MagicLinkMailer.ts";
import { DomainError } from "../errors/DomainError.ts";
import { safeReturnPath } from "../rules/authRules.ts";
import {
  SESSION_TTL_MS,
  LOGIN_LINK_TTL_MS,
  type SessionUseCases,
  type RequestLoginCommand,
} from "./interfaces/SessionUseCases.ts";

interface SessionServiceDependencies {
  sessions: SessionRepository;
  links: LoginLinkRepository;
  transactions: TransactionManager;
  clock: Clock;
  generateId: IdGenerator;
  tokens: SessionTokens;
  mailer: MagicLinkMailer;
  publicUrl: string;
}

export class SessionService implements SessionUseCases {
  constructor(private readonly dependencies: SessionServiceDependencies) {}
  get localMail() {
    return this.dependencies.mailer.deliveryMode === "local";
  }
  findPerson(token?: string) {
    const { sessions, tokens, clock } = this.dependencies;
    return token && tokens.isValid(token)
      ? sessions.findPerson(tokens.hash(token), clock.now().getTime())
      : null;
  }

  async requestLink(command: RequestLoginCommand) {
    const { links, transactions, clock, tokens, mailer, publicUrl } =
      this.dependencies;
    const now = clock.now().getTime();
    const email = command.email.trim().toLowerCase();
    const token = tokens.issue();
    const flowToken = tokens.issue();
    const previous = this.findPerson(command.existingToken);
    transactions.run(() => {
      links.cleanup(now);
      const emailHash = tokens.hash(`email:${email}`),
        ipHash = tokens.hash(`ip:${command.ip}`);
      if (
        links.countForEmail(emailHash, now - 60_000) >= 1 ||
        links.countForEmail(emailHash, now - 3_600_000) >= 5 ||
        links.countForIp(ipHash, now - 3_600_000) >= 20
      ) {
        throw new DomainError(
          "AUTH_RATE_LIMIT",
          "Llegaste al límite de solicitudes. Intentá más tarde.",
        );
      }
      links.recordRequest(emailHash, ipHash, now);
      links.insert({
        tokenHash: tokens.hash(token),
        flowHash: tokens.hash(flowToken),
        email,
        name: command.name,
        returnTo: safeReturnPath(command.returnTo),
        createdAt: now,
        expiresAt: now + LOGIN_LINK_TTL_MS,
        consumedAt: null,
        legacyPersonId: previous && !previous.email ? previous.id : null,
        legacySessionHash:
          previous && !previous.email && command.existingToken
            ? tokens.hash(command.existingToken)
            : null,
      });
    });
    try {
      // El token solo viaja por el correo; no se devuelve al cliente HTTP.
      await mailer.send({
        to: email,
        name: command.name,
        url: `${publicUrl}/acceso#token=${token}`,
        expiresAt: new Date(now + LOGIN_LINK_TTL_MS).toISOString(),
      });
    } catch {
      links.remove(tokens.hash(token));
      throw new DomainError(
        "MAIL_UNAVAILABLE",
        "No pudimos preparar el correo. Intentá nuevamente más tarde.",
      );
    }
    return { flowToken };
  }

  verify(token: string, flowToken?: string, existingToken?: string) {
    const { sessions, links, transactions, clock, tokens, generateId } =
      this.dependencies;
    const invalid = () =>
      new DomainError(
        "INVALID_LOGIN_LINK",
        "El enlace venció, ya fue utilizado o no corresponde a este navegador. Pedí uno nuevo desde aquí.",
      );
    if (!tokens.isValid(token) || !flowToken || !tokens.isValid(flowToken))
      throw invalid();
    return transactions.run(() => {
      const now = clock.now().getTime();
      const link = links.find(tokens.hash(token));
      if (
        !link ||
        link.consumedAt !== null ||
        link.expiresAt <= now ||
        link.flowHash !== tokens.hash(flowToken)
      )
        throw invalid();
      if (!links.consume(link.tokenHash, now)) throw invalid();
      const previous = this.findPerson(existingToken);
      const canClaim =
        previous &&
        !previous.email &&
        previous.id === link.legacyPersonId &&
        existingToken &&
        tokens.hash(existingToken) === link.legacySessionHash &&
        !sessions.hasAccount(previous.id);
      let person = sessions.findAccount(link.email);
      if (!person) {
        person = canClaim
          ? { id: previous.id, name: previous.name }
          : { id: generateId(), name: link.name };
        if (!canClaim) sessions.insertPerson(person);
        sessions.insertAccount(link.email, person.id);
      }
      if (canClaim) {
        if (previous.id !== person.id)
          sessions.mergeLegacyPerson(previous.id, person.id);
        sessions.revokePersonSessions(previous.id);
      }
      // Rotar la sesión impide reutilizar la credencial anterior del navegador.
      if (existingToken && tokens.isValid(existingToken))
        sessions.revokeSession(tokens.hash(existingToken));
      const sessionToken = tokens.issue();
      sessions.insertSession({
        tokenHash: tokens.hash(sessionToken),
        personId: person.id,
        expiresAt: now + SESSION_TTL_MS,
      });
      return {
        person: { ...person, email: link.email },
        token: sessionToken,
        returnTo: link.returnTo,
      };
    });
  }

  logout(token?: string) {
    const { sessions, tokens } = this.dependencies;
    if (token && tokens.isValid(token))
      sessions.revokeSession(tokens.hash(token));
  }
}
