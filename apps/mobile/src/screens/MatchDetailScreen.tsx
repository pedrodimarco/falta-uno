import { useState } from "react";
import { Share } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../shared/components/Screen";
import {
  Body,
  Button,
  Card,
  Label,
  Loading,
  Notice,
  Title,
} from "../shared/components/ui";
import { useMatch } from "../features/matches/hooks/useMatch";
import { formatDate, formatPrice } from "../features/matches/formatters";
import { Participation } from "../features/matches/components/Participation";
import { environment } from "../config/environment";
import { errorMessage } from "../shared/utils/errors";

export function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useMatch(id);
  const [shareError, setShareError] = useState("");
  const match = state.match;
  async function share() {
    if (!match) return;
    try {
      setShareError("");
      await Share.share({
        title: match.title,
        message: `${match.title} · ${formatDate(match)} · ${match.venue}\n${environment.webUrl}/partidos/${match.id}`,
      });
    } catch (error) {
      setShareError(errorMessage(error));
    }
  }
  return (
    <Screen>
      {state.loading ? (
        <Loading />
      ) : (
        <>
          {state.error && (
            <>
              <Notice message={state.error} />
              <Button title="Reintentar" onPress={state.reload} />
            </>
          )}
          {match && (
            <>
              <Label>
                {match.sport}
                {match.isOrganizer ? " · Lo organizás vos" : ""}
              </Label>
              <Title>{match.title}</Title>
              <Card>
                <Label>{formatDate(match)}</Label>
                <Body>
                  {match.venue}
                  {"\n"}
                  {formatPrice(match)}
                  {"\n"}Organiza {match.organizer.name}
                </Body>
                <Label>
                  {match.confirmed}/{match.capacity} confirmados
                </Label>
                <Body>
                  {Math.max(
                    0,
                    match.capacity - match.confirmed - match.reserved,
                  )}{" "}
                  cupos libres
                  {match.reserved
                    ? ` · ${match.reserved} reservado(s) por oferta`
                    : ""}
                </Body>
                {match.notes ? <Body>{match.notes}</Body> : null}
              </Card>
              <Notice message={state.actionError} />
              <Participation
                match={match}
                pending={state.pending}
                run={state.run}
                reload={state.reload}
              />
              <Card>
                <Label>Quiénes juegan</Label>
                {match.players.length ? (
                  match.players.map((player) => (
                    <Body key={player.id}>
                      {player.name}
                      {player.id === match.organizer.id ? " · organiza" : ""}
                    </Body>
                  ))
                ) : (
                  <Body>Todavía no hay confirmados.</Body>
                )}
              </Card>
              {match.waitingList.length > 0 && (
                <Card>
                  <Label>Lista de espera</Label>
                  {match.waitingList.map((entry) => (
                    <Body key={entry.person.id}>
                      {entry.position}. {entry.person.name}
                      {entry.status === "offered" ? " · tiene una oferta" : ""}
                    </Body>
                  ))}
                </Card>
              )}
              <Notice message={shareError} />
              <Button
                title="Compartir invitación"
                secondary
                onPress={() => {
                  void share();
                }}
              />
              <Button
                title="Actualizar partido"
                secondary
                disabled={state.pending}
                onPress={state.reload}
              />
            </>
          )}
        </>
      )}
    </Screen>
  );
}
