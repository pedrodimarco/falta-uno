import { createHash, randomBytes } from "node:crypto";
import type { SessionTokens } from "../services/interfaces/dependencies.ts";

export class CryptoSessionTokens implements SessionTokens {
  issue(): string {
    return randomBytes(32).toString("hex");
  }

  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  isValid(token: string): boolean {
    return /^[a-f0-9]{64}$/.test(token);
  }
}
