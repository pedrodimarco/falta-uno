# Falta uno · React Native

Primera aplicación móvil con **Expo SDK 57, React Native 0.86, React 19.2 y TypeScript**. Usa la API Express existente y los contratos de `@falta-uno/contracts`. Android e iOS comparten las pantallas y las reglas del servidor.

## Qué está conectado

- Solicitud y confirmación del acceso por correo, sin contraseña.
- Sesión persistida con SecureStore en Android/iOS y revocación al cerrar sesión.
- Mis partidos: organizados, confirmados y en lista de espera.
- Creación de partidos con deporte, fecha/hora, lugar, cupos, costo y notas.
- Detalle público, participantes, confirmación y cancelación propia.
- Lista de espera, ofertas, aceptación, rechazo y contador de vencimiento.
- Actualización cada 15 segundos con la pantalla enfocada y al volver del segundo plano.
- Apertura de invitaciones pegando su enlace y compartir mediante la hoja nativa del sistema.

No se envían correos reales: se mantiene el buzón local elegido para el proyecto. La apertura automática del correo en la app mediante Universal Links/App Links y las notificaciones push quedan para otra entrega. El esquema `falta-uno` está preparado para un development build; Expo Go usa sus propios enlaces de desarrollo.

## Probar en un teléfono con Expo Go

Requiere Node 24+, npm, teléfono y computadora en la misma Wi-Fi, y Expo Go compatible con SDK 57. Se eligió este SDK siguiendo la [indicación de Expo para dispositivos físicos durante la transición a SDK 58](https://docs.expo.dev/get-started/create-a-project/). No hace falta una cuenta Expo ni generar un APK para este recorrido.

Desde la **raíz del repositorio**:

```bash
npm install
cp apps/mobile/.env.example apps/mobile/.env
```

Editá `apps/mobile/.env` con la IP local de tu computadora:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
EXPO_PUBLIC_WEB_URL=http://192.168.1.100:5173
```

Reemplazá `192.168.1.100` por tu IP. En Linux podés consultarla con `hostname -I`. Las variables `EXPO_PUBLIC_*` se incluyen en el bundle: son direcciones públicas, nunca contraseñas.

Abrí dos terminales:

```bash
# Terminal 1: API accesible desde tu red local
HOST=0.0.0.0 npm run dev:api
```

```bash
# Terminal 2: Metro y QR de Expo Go
npm run dev:mobile
```

Escaneá el QR con Expo Go en Android o la cámara en iOS. Para comprobar conectividad, abrí `http://TU_IP:3001/api/health` en el navegador del teléfono; debe responder `{"ok":true}`. Si falla, revisá que ambos dispositivos estén en la misma red y el acceso al puerto 3001. Un túnel de Metro no publica la API.

Si ya tenés otra API escuchando en 3001 solo en localhost, detenela desde su terminal y reiniciala con `HOST=0.0.0.0`. No ejecutes dos procesos con la misma base de datos y puerto.

### Acceso local

1. Pedí el enlace con tu nombre y correo **desde la app**.
2. En la computadora ejecutá `npm run mail:latest` y copiá el enlace del correo correspondiente a tu dirección.
3. Pegalo en “Enlace del correo de acceso” en el teléfono y presioná “Confirmar acceso”. Podés transferir ese enlace de prueba a tu dispositivo por el medio que uses habitualmente; no lo publiques.
4. Creá un partido o pegá una invitación desde el inicio.

El enlace debe verificarse en la misma instalación que lo solicitó. Si lo pediste desde la web, pedí uno nuevo desde la app: cada solicitud tiene su propia prueba temporal. La cuenta y los partidos se comparten al usar el mismo correo. El enlace vence a los 10 minutos; una sesión dura 30 días. Cerrar sesión revoca solo esa sesión. Los límites de solicitudes son comunes a web y móvil.

### Compartir invitaciones en la red local

`EXPO_PUBLIC_WEB_URL` indica dónde está la web que abre una invitación compartida. Si querés que otro teléfono pueda abrirla en su navegador, iniciá también Vite:

```bash
npm run dev -w @falta-uno/web -- --host 0.0.0.0
```

La API ya debe estar ejecutándose. También podés copiar el enlace y pegarlo en la app receptora, que consulta su API configurada. Estas direcciones solo sirven en tu red local; para invitar fuera de ella hará falta desplegar la API y la web.

## Emuladores y vista web de desarrollo

| Entorno                         | `EXPO_PUBLIC_API_URL`   | Cómo iniciar             |
| ------------------------------- | ----------------------- | ------------------------ |
| Android Emulator                | `http://10.0.2.2:3001`  | `npm run mobile:android` |
| iOS Simulator (macOS con Xcode) | `http://127.0.0.1:3001` | `npm run mobile:ios`     |
| Vista web local                 | `http://127.0.0.1:3001` | `npm run mobile:web`     |

Android Emulator requiere Android Studio/SDK y un dispositivo virtual iniciado. iOS Simulator requiere macOS y Xcode. Esta entrega no instala esas herramientas del sistema. Cambiá las variables de `.env` según el entorno y reiniciá Metro cuando corresponda.

La vista web permite revisar pantallas con React Native Web. En desarrollo, la API permite CORS únicamente para los orígenes locales configurados (incluido localhost/127.0.0.1:8081). Sus credenciales viven **solo en memoria** y se pierden al recargar; no sustituye la prueba de SecureStore ni la ejecución en un dispositivo real. La web React original sigue en 5173.

## Estructura

```text
src/
  app/                       Rutas Expo Router y composición de providers
    partidos/[id].tsx        Reexporta la pantalla, sin lógica de negocio
  screens/                   Pantallas que componen cada recorrido
  features/
    session/
      api.ts                 Endpoints de acceso móvil
      SessionProvider.tsx    Identidad, restauración y cierre de sesión
      hooks/useLogin.ts      Solicitud y confirmación del enlace
      loginLink.ts           Lectura segura del enlace pegado
    matches/
      api.ts                 Endpoints de partidos y participación
      hooks/                 Carga, actualización y acciones
      components/            Formulario, tarjetas, participación y ofertas
      matchForm.ts           Fecha local → UTC; pesos → centésimos; validación
      formatters.ts          Fechas e importes para mostrar
      matchLink.ts           Extracción del ID de una invitación
  shared/
    api/                     Transporte HTTP, timeout y errores
    storage/                 Adaptadores de SecureStore y memoria para web
    components/              Controles y estructura de pantalla
    theme.ts                 Colores compartidos
    utils/                   Mensajes de error
  config/                    Variables de entorno validadas
tests/                       Pruebas del transporte y transformaciones
```

**Recorrido:** ruta → pantalla → hook → API de la funcionalidad → cliente HTTP → Express → controllers → services → repositories. Los componentes muestran datos y disparan acciones; las reglas de cupos, permisos y espera siguen en el backend.

Se comparten tipos y validaciones, sin importar componentes HTML/CSS desde `apps/web`. Metro usa el [soporte de monorepos de Expo](https://docs.expo.dev/guides/monorepos/), sin aliases ni rutas de node_modules manuales.

React, React DOM, Reanimated y Worklets están fijados a versiones compatibles en el workspace y en los overrides raíz para que todas las dependencias resuelvan la misma versión. Al actualizar Expo, revisá sus versiones recomendadas antes de cambiarlas.

## Sesión móvil

El cliente utiliza `Authorization: Bearer …` y no depende de las cookies de React Native. El secreto de sesión y la prueba temporal de solicitud se guardan con [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) y se separan por origen de API. El secreto que valida el correo se entrega únicamente en el correo. No hay endpoint para descargar el buzón desde el teléfono.

Los endpoints `/api/mobile/session` son adaptadores HTTP: reutilizan `SessionService`, las sesiones existentes y sus hashes en SQLite. No agregan cuentas ni reglas de autenticación paralelas. La web conserva sus cookies HttpOnly. Fuera de desarrollo, la configuración móvil exige HTTPS.

## Comprobaciones

```bash
npm run check
npm test
npm run format:mobile:check
npm run mobile:export
```

`mobile:export` genera bundles Android/iOS en `apps/mobile/dist` (ignorado). Verifica el código y los assets con Metro/Hermes; no genera APK/IPA ni demuestra ejecución nativa. Una prueba en teléfono sigue siendo necesaria para teclado, áreas seguras, restauración de sesión y compartir.

Prueba manual sugerida: ingresar → crear partido → volver al inicio → abrir detalle → abrir la misma invitación desde otra cuenta → confirmar → llenar cupos → lista de espera → liberar un lugar → aceptar la oferta. Cerrar y abrir la app debe recuperar la sesión; cerrar sesión en móvil debe conservar una sesión web independiente.

### Dependencias pendientes de actualización

La instalación de SDK 57 reporta siete avisos de `npm audit`: tres altos en la cadena `expo-router → query-string → decode-uri-component` y cuatro moderados en herramientas de fingerprint/glob/minimatch. No se aplica `npm audit fix --force`: propone cambios de SDK incompatibles con esta base. El decodificador corregido cambia CommonJS por ESM y no es un reemplazo directo para el consumidor actual. Antes de una publicación, actualizar al SDK compatible que incorpore estas correcciones y volver a verificar navegación y bundles. Esta primera entrega es para desarrollo local.
