import { Redirect, router } from "expo-router";
import { Screen } from "../shared/components/Screen";
import { Body, Button, Loading, Notice, Title } from "../shared/components/ui";
import { MatchForm } from "../features/matches/components/MatchForm";
import { useSession } from "../features/session/SessionContext";
export function CreateMatchScreen() {
  const session = useSession();
  if (session.loading)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (session.error)
    return (
      <Screen>
        <Notice message={session.error} />
        <Button
          title="Reintentar"
          onPress={() => {
            void session.refresh();
          }}
        />
      </Screen>
    );
  if (!session.person) return <Redirect href="/ingresar" />;
  return (
    <Screen>
      <Title>Armemos un partido</Title>
      <Body>Elegí cuándo, dónde y cuántos juegan.</Body>
      <MatchForm
        onCreated={(match) =>
          router.replace({
            pathname: "/partidos/[id]",
            params: { id: match.id },
          })
        }
      />
    </Screen>
  );
}
