import type { MatchSummary } from "@busco/contracts";
import { router } from "expo-router";
import { Body, Button, Card, Label } from "../../../shared/components/ui";
import { formatDate } from "../formatters";

export function MatchCard({ match }: { match: MatchSummary }) {
  return (
    <Card>
      <Label>
        {match.sport} · {match.confirmed}/{match.capacity} confirmados
      </Label>
      <Label>{match.title}</Label>
      <Body>
        {formatDate(match)}
        {"\n"}
        {match.venue}
      </Body>
      {match.reserved > 0 && (
        <Body>{match.reserved} cupo(s) reservado(s) por oferta</Body>
      )}
      <Button
        title="Ver partido"
        secondary
        onPress={() =>
          router.push({ pathname: "/partidos/[id]", params: { id: match.id } })
        }
      />
    </Card>
  );
}
