import * as SecureStore from "expo-secure-store";
import { environment } from "../../config/environment";

const prefix = `bp.${environment.apiUrl.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
export const credentials = {
  get: (key: "session" | "flow") =>
    SecureStore.getItemAsync(`${prefix}.${key}`),
  set: (key: "session" | "flow", value: string) =>
    SecureStore.setItemAsync(`${prefix}.${key}`, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  remove: (key: "session" | "flow") =>
    SecureStore.deleteItemAsync(`${prefix}.${key}`),
};
