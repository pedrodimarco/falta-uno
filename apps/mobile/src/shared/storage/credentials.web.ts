// La vista web es una herramienta de desarrollo. No persiste secretos en localStorage.
const values = new Map<string, string>();
export const credentials = {
  get: async (key: "session" | "flow") => values.get(key) ?? null,
  set: async (key: "session" | "flow", value: string) => {
    values.set(key, value);
  },
  remove: async (key: "session" | "flow") => {
    values.delete(key);
  },
};
