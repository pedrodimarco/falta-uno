/** Solo se extrae el secreto del correo; nunca se navega al texto pegado. */
export function loginToken(value: string): string {
  const trimmed = value.trim();
  if (/^[a-f0-9]{64}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.pathname !== "/acceso"
    )
      throw new Error();
    const token = new URLSearchParams(url.hash.slice(1)).get("token");
    if (token && /^[a-f0-9]{64}$/.test(token)) return token;
  } catch {
    /* Mensaje único, sin registrar credenciales. */
  }
  throw new Error("Pegá el enlace completo del correo de acceso.");
}
