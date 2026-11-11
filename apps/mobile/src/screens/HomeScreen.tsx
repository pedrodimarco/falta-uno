import { useState } from "react";
import { router } from "expo-router";
import { Screen } from "../shared/components/Screen";
import {
  Body,
  Button,
  Card,
  Field,
  Label,
  Loading,
  Notice,
  Title,
} from "../shared/components/ui";
import { useSession } from "../features/session/SessionContext";
import { useMyMatches } from "../features/matches/hooks/useMyMatches";
import { MatchCard } from "../features/matches/components/MatchCard";
import { matchIdFromLink } from "../features/matches/matchLink";
import { errorMessage } from "../shared/utils/errors";

export function HomeScreen() {
  const session = useSession();
  const list = useMyMatches();
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  
  function openMatch() {
    try {
      setError("");
      router.push({
        pathname: "/partidos/[id]",
        params: { id: matchIdFromLink(link) },
      });
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      await session.signOut();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <Screen>
      <Title>El próximo partido empieza acá.</Title>
      <Body>
        Armá el encuentro, compartilo con tus amigos y asegurá tu lugar.
      </Body>
      {session.loading ? (
        <Loading />
      ) : session.error ? (
        <>
          <Notice message={session.error} />
          <Button
            title="Reintentar conexión"
            onPress={() => {
              void session.refresh();
            }}
          />
        </>
      ) : session.person ? (
        <Card>
          <Label>Hola, {session.person.name}</Label>
          <Body>{session.person.email}</Body>
          <Button
            title="Organizar un partido"
            onPress={() => router.push("/partidos/nuevo")}
          />
          <Button
            title={signingOut ? "Cerrando…" : "Cerrar sesión"}
            secondary
            disabled={signingOut}
            onPress={() => {
              void signOut();
            }}
          />
        </Card>
      ) : (
        <Card>
          <Label>Jugá con tu gente</Label>
          <Body>
            Ingresá con tu correo para organizar partidos y confirmar
            asistencia.
          </Body>
          <Button title="Ingresar" onPress={() => router.push("/ingresar")} />
        </Card>
      )}
      <Card>
        <Label>¿Te pasaron un partido?</Label>
        <Field
          label="Enlace del partido"
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Pegá el enlace de invitación"
        />
        <Button
          title="Abrir partido"
          secondary
          disabled={!link.trim()}
          onPress={openMatch}
        />
      </Card>
      <Notice message={error} />
      {session.person && (
        <>
          <Title>Mis partidos</Title>
          <Body>Los que organizás, jugás o tenés en espera.</Body>
          <Notice message={list.error} />
          {list.loading ? (
            <Loading />
          ) : list.matches.length === 0 && !list.error ? (
            <Card>
              <Body>
                Todavía no hay partidos. Creá el primero o abrí una invitación.
              </Body>
            </Card>
          ) : (
            list.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          )}
          <Button
            title="Actualizar partidos"
            secondary
            disabled={list.loading}
            onPress={list.reload}
          />
        </>
      )}
    </Screen>
  );
}
