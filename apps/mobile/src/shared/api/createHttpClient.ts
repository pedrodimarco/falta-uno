export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

interface ClientOptions {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  onUnauthorized: (token: string) => Promise<void>;
  fetcher?: typeof fetch;
}

/** El transporte no conoce React ni SecureStore y se puede probar por separado. */
export function createHttpClient({
  baseUrl,
  getToken,
  onUnauthorized,
  fetcher = fetch,
}: ClientOptions) {
  return async function http<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (!path.startsWith("/") || path.startsWith("//"))
      throw new Error("Ruta de API inválida.");
    const token = await getToken();
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (options.signal?.aborted) abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, 15_000);
    try {
      const response = await fetcher(`${baseUrl}/api${path}`, {
        ...options,
        credentials: "omit",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (response.status === 401 && token) await onUnauthorized(token);
        throw new ApiError(
          payload?.error || "No pudimos completar la operación.",
          response.status,
          payload?.code || "HTTP_ERROR",
        );
      }
      return response.status === 204
        ? (undefined as T)
        : ((await response.json()) as T);
    } catch (error) {
      if (controller.signal.aborted && !options.signal?.aborted)
        throw new Error(
          "La conexión demoró demasiado. Revisá la red y volvé a intentar.",
        );
      if (error instanceof TypeError)
        throw new Error(
          "No pudimos conectar con el servidor. Revisá la dirección de la API y tu conexión.",
        );
      throw error;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abort);
    }
  };
}
