export function matchIdFromLink(value: string) {
  const text = value.trim();
  const idPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (idPattern.test(text)) return text;
  try {
    const url = new URL(text);
    if (!["http:", "https:", "falta-uno:"].includes(url.protocol))
      throw new Error();
    const path =
      url.protocol === "falta-uno:"
        ? `/${url.host}${url.pathname}`
        : url.pathname;
    const id = /^\/partidos\/([^/]+)\/?$/.exec(path)?.[1];
    if (id && idPattern.test(id)) return id;
  } catch {
    /* No se abre ninguna URL externa. */
  }
  throw new Error("Pegá un enlace de partido válido.");
}
