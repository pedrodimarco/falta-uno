import { useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Screen } from "../shared/components/Screen";
import {
  Body,
  Button,
  Card,
  Field,
  Loading,
  Notice,
  Title,
} from "../shared/components/ui";
import { useLogin } from "../features/session/hooks/useLogin";
import { useSession } from "../features/session/SessionContext";

export function LoginScreen() {
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const session = useSession();
  const login = useLogin();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  if (session.loading || login.initializing)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (session.person)
    return (
      <Redirect
        href={
          matchId
            ? { pathname: "/partidos/[id]", params: { id: matchId } }
            : "/"
        }
      />
    );
  async function verify() {
    if (await login.verify(link))
      router.replace(
        matchId ? { pathname: "/partidos/[id]", params: { id: matchId } } : "/",
      );
  }
  return (
    <Screen>
      <Title>{login.flow ? "Revisá tu correo" : "Ingresá para jugar"}</Title>
      <Body>
        Usamos un enlace de acceso de un solo uso. No necesitás contraseña.
      </Body>
      <Card>
        {login.flow ? (
          <>
            <Body>
              {login.localMail || __DEV__
                ? "En el modo local, el correo se guarda en el buzón de prueba. Ejecutá npm run mail:latest en tu computadora y copiá el enlace acá."
                : "Copiá el enlace del correo y pegalo acá para confirmar el acceso en esta app."}
            </Body>
            <Field
              label="Enlace del correo de acceso"
              value={link}
              onChangeText={setLink}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
              placeholder="Pegá el enlace completo"
            />
            <Body>
              Vence a los 10 minutos. Confirmalo en la misma app desde la que lo
              pediste.
            </Body>
            <Button
              title={login.busy ? "Verificando…" : "Confirmar acceso"}
              disabled={login.busy || !link.trim()}
              onPress={() => {
                void verify();
              }}
            />
            <Button
              title="Pedir otro enlace"
              secondary
              disabled={login.busy}
              onPress={() => {
                setLink("");
                void login.reset();
              }}
            />
          </>
        ) : (
          <>
            <Field
              label="Tu nombre"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              maxLength={60}
            />
            <Field
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={254}
            />
            <Button
              title={
                login.busy ? "Preparando enlace…" : "Pedir enlace de acceso"
              }
              disabled={login.busy}
              onPress={() => {
                void login.request(name, email);
              }}
            />
          </>
        )}
        <Notice message={login.error} />
      </Card>
    </Screen>
  );
}
