import { Platform } from "react-native";

function origin(value: string, name: string) {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `${name} debe ser un origen HTTP(S), sin ruta ni credenciales.`,
    );
  }
  if (!__DEV__ && url.protocol !== "https:")
    throw new Error(`${name} debe usar HTTPS fuera de desarrollo.`);
  return url.origin;
}

const localApi =
  Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://127.0.0.1:3001";
export const environment = {
  apiUrl: origin(
    process.env.EXPO_PUBLIC_API_URL || localApi,
    "EXPO_PUBLIC_API_URL",
  ),
  webUrl: origin(
    process.env.EXPO_PUBLIC_WEB_URL || "http://127.0.0.1:5173",
    "EXPO_PUBLIC_WEB_URL",
  ),
};
