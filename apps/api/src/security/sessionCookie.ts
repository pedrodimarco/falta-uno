import type { Request, CookieOptions } from "express";
import {
  SESSION_TTL_MS,
  LOGIN_LINK_TTL_MS,
} from "../services/interfaces/SessionUseCases.ts";
export const SESSION_COOKIE_NAME = "bp_session";
export const FLOW_COOKIE_NAME = "bp_login_flow";
function readCookie(request: Request, name: string) {
  return request.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
export const readSessionToken = (request: Request) =>
  readCookie(request, SESSION_COOKIE_NAME);
export const readFlowToken = (request: Request) =>
  readCookie(request, FLOW_COOKIE_NAME);
export function sessionCookieOptions(
  secure: boolean,
  includeExpiry = true,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    ...(includeExpiry ? { maxAge: SESSION_TTL_MS } : {}),
  };
}
export function flowCookieOptions(
  secure: boolean,
  includeExpiry = true,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/api/session",
    ...(includeExpiry ? { maxAge: LOGIN_LINK_TTL_MS } : {}),
  };
}
