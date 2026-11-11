import { useEffect, useState } from "react";
import type { MatchDetail } from "@falta-uno/contracts";
import { Body, Button, Label } from "../../../shared/components/ui";

export function OfferActions({
  offer,
  pending,
  onAccept,
  onDecline,
  reload,
}: {
  offer: NonNullable<MatchDetail["offer"]>;
  pending: boolean;
  onAccept: () => void;
  onDecline: () => void;
  reload: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const remaining = Math.max(
    0,
    Math.ceil((new Date(offer.expiresAt).getTime() - now) / 1000),
  );
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <Label>
        {remaining > 0 ? "¡Se liberó un lugar para vos!" : "La oferta venció"}
      </Label>
      <Body>
        {remaining > 0
          ? `Tenés ${Math.floor(remaining / 60)} min ${String(remaining % 60).padStart(2, "0")} s para confirmar tu lugar.`
          : "Actualizá el partido para consultar el estado actual."}
      </Body>
      {remaining > 0 ? (
        <>
          <Button title="Aceptar lugar" disabled={pending} onPress={onAccept} />
          <Button
            title="Rechazar oferta"
            secondary
            disabled={pending}
            onPress={onDecline}
          />
        </>
      ) : (
        <Button title="Actualizar estado" onPress={reload} />
      )}
    </>
  );
}
