import { router } from "expo-router";
import { Screen } from "../shared/components/Screen";
import { Body, Button, Title } from "../shared/components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Title>No encontramos esta pantalla</Title>
      <Body>Volvé al inicio para abrir un partido.</Body>
      <Button title="Ir al inicio" onPress={() => router.replace("/")} />
    </Screen>
  );
}
