import type { Request } from "express";
import { readSessionToken } from "./sessionCookie.ts";

export function readBearerToken(request: Request) {
  return /^Bearer ([a-f0-9]{64})$/i.exec(
    request.get("authorization") ?? "",
  )?.[1];
}

/** Una cabecera inválida nunca cae a una cookie de otra identidad. */
export function readRequestSessionToken(request: Request) {
  return request.get("authorization") !== undefined
    ? readBearerToken(request)
    : readSessionToken(request);
}
