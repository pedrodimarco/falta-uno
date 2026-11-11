import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../features/session/SessionProvider";
import { theme } from "../shared/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.primary,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Falta uno" }} />
          <Stack.Screen name="ingresar" options={{ title: "Acceso" }} />
          <Stack.Screen
            name="partidos/nuevo"
            options={{ title: "Organizar" }}
          />
          <Stack.Screen
            name="partidos/[id]"
            options={{ title: "El partido" }}
          />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
