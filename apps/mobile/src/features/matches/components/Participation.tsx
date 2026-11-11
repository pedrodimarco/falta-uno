import type { MatchDetail } from "@falta-uno/contracts";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import { Body, Button, Card, Label } from "../../../shared/components/ui";
import { useSession } from "../../session/SessionContext";
import * as api from "../api";
import { OfferActions } from "./OfferActions";

export function Participation({
  match,
  pending,
  run,
  reload,
}: {
  match: MatchDetail;
  pending: boolean;
  run: (action: () => Promise<MatchDetail>) => Promise<void>;
  reload: () => void;
}) {
  const { person } = useSession();
  const action = (operation: () => Promise<MatchDetail>) => {
    void run(operation);
  };
  const cancel = () => {
    if (Platform.OS === "web") {
      if (globalThis.confirm("¿Cancelar tu lugar en este partido?"))
        action(() => api.cancelParticipation(match.id));
    } else
      Alert.alert(
        "¿Cancelar tu lugar?",
        "El cupo quedará disponible para otra persona.",
        [
          { text: "Conservar lugar", style: "cancel" },
          {
            text: "Cancelar participación",
            style: "destructive",
            onPress: () => action(() => api.cancelParticipation(match.id)),
          },
        ],
      );
  };
  if (match.closed)
    return (
      <Card>
        <Label>El partido ya comenzó</Label>
        <Body>La inscripción está cerrada.</Body>
      </Card>
    );
  if (!person?.email)
    return (
      <Card>
        <Body>Ingresá para confirmar tu lugar o anotarte en la espera.</Body>
        <Button
          title="Ingresar para participar"
          onPress={() =>
            router.push({
              pathname: "/ingresar",
              params: { matchId: match.id },
            })
          }
        />
      </Card>
    );
  if (match.joined)
    return (
      <Card>
        <Label>Tu lugar está confirmado</Label>
        <Button
          title="Cancelar mi participación"
          secondary
          disabled={pending}
          onPress={cancel}
        />
      </Card>
    );
  if (match.offer)
    return (
      <Card>
        <OfferActions
          key={match.offer.id}
          offer={match.offer}
          pending={pending}
          reload={reload}
          onAccept={() =>
            action(() => api.acceptOffer(match.id, match.offer!.id))
          }
          onDecline={() =>
            action(() => api.declineOffer(match.id, match.offer!.id))
          }
        />
      </Card>
    );
  if (match.waitlistPosition !== null)
    return (
      <Card>
        <Label>Estás en la lista de espera</Label>
        <Body>
          Tu posición es {match.waitlistPosition}. Si se libera un lugar,
          tendrás que aceptar la oferta.
        </Body>
        <Button
          title="Salir de la lista de espera"
          secondary
          disabled={pending}
          onPress={() => action(() => api.leaveWaitlist(match.id))}
        />
      </Card>
    );
  const full = match.confirmed + match.reserved >= match.capacity;
  return (
    <Card>
      <Label>{full ? "No hay cupos libres" : "Sumate al partido"}</Label>
      {match.waitlistState === "expired" && (
        <Body>Tu oferta anterior venció. Podés volver a anotarte.</Body>
      )}
      <Body>
        {full
          ? "Anotate en la espera. Los lugares se ofrecen por orden y requieren tu aceptación."
          : "Confirmá tu participación para reservar un lugar."}
      </Body>
      <Button
        title={full ? "Anotarme en lista de espera" : "Confirmar mi lugar"}
        disabled={pending}
        onPress={() =>
          action(() =>
            full
              ? api.joinWaitlist(match.id)
              : api.confirmParticipation(match.id),
          )
        }
      />
    </Card>
  );
}
