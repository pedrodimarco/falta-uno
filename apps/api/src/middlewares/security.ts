import type { RequestHandler } from "express";
import { HttpError } from "../errors/HttpError.ts";

export const securityHeaders: RequestHandler = (_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "same-origin");
  next();
};

export function apiSecurity(allowedOrigins: readonly string[]): RequestHandler {
  return (request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    const originHeader = request.get("origin");
    // Solo los orígenes configurados pueden leer la API desde un navegador.
    if (originHeader && allowedOrigins.includes(originHeader)) {
      response.setHeader("Access-Control-Allow-Origin", originHeader);
      response.vary("Origin");
      response.setHeader("Access-Control-Allow-Credentials", "true");
      response.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
      response.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      if (request.method === "OPTIONS") {
        response.status(204).end();
        return;
      }
    }
    if (["GET", "HEAD", "OPTIONS"].includes(request.method) || !originHeader)
      return next();

    let origin: URL;
    try {
      origin = new URL(originHeader);
    } catch {
      throw new HttpError(403, "ORIGIN", "Origen no permitido.");
    }
    if (
      origin.host !== request.get("host") &&
      !allowedOrigins.includes(origin.origin)
    ) {
      throw new HttpError(403, "ORIGIN", "Origen no permitido.");
    }
    next();
  };
}
