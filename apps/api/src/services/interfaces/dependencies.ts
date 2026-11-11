/** Puertos de infraestructura: las implementaciones se conectan en bootstrap. */
export interface TransactionManager {
  run<T>(operation: () => T): T;
}

export interface Clock {
  now(): Date;
}

export type IdGenerator = () => string;

export interface SessionTokens {
  issue(): string;
  hash(token: string): string;
  isValid(token: string): boolean;
}
