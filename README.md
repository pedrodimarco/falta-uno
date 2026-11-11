# Falta uno

Primera entrega local para organizar partidos entre amigos. React + TypeScript en la web, Node.js + Express en la API y SQLite para persistencia. La aplicación React Native con Expo ya utiliza esta misma API.

## Ejecutar

Requiere Node.js 24 o superior y npm.

```bash
npm install
npm run dev
```

Abrí la dirección que imprime Vite, normalmente `http://127.0.0.1:5173`. La API escucha en `http://127.0.0.1:3001`; Vite reenvía `/api` para mantener las cookies en el mismo origen. No mezcles `localhost` con `127.0.0.1` durante una sesión.

Para probar la compilación servida por Express:

```bash
npm run build
APP_URL=http://127.0.0.1:3001 npm start
```

Abrí `http://127.0.0.1:3001`. Por defecto ambos servidores escuchan solo en la interfaz local. Para usar un teléfono, seguí la configuración de red de la aplicación móvil indicada abajo. Esta entrega no está publicada. El enlace y WhatsApp están preparados, pero un enlace local solo funciona en esta computadora; para compartir realmente hace falta desplegar el servidor con una dirección pública.

## Aplicación móvil

La primera versión con React Native y Expo está en `apps/mobile`, con acceso por correo, partidos, creación, participación, lista de espera y ofertas. Usá `npm run dev:mobile` para iniciar Metro. Para probar en Expo Go necesitás configurar la IP local de la API y ejecutarla con `HOST=0.0.0.0 npm run dev:api`.

La preparación paso a paso, estructura y limitaciones están en [apps/mobile/README.md](apps/mobile/README.md).

## Qué funciona

- Crear partidos de fútbol 5, pádel, básquet u otro deporte.
- Indicar lugar, fecha, zona horaria, cupos, notas y costo por persona en UYU.
- Consultar partidos por enlace sin identificarse.
- Ingresar por correo con un enlace de un solo uso y confirmar o cancelar la participación propia.
- Incluir al organizador como jugador, de forma opcional.
- Listar los partidos organizados o en los que participa la sesión actual.
- Copiar el enlace o abrir WhatsApp con un mensaje preparado; el envío lo hace el usuario.
- Persistir datos y sesiones tras reiniciar el servidor.
- Actualizar el detalle cada 15 segundos y al recuperar el foco.
- Anotarse y salir de una lista de espera ordenada.
- Reservar cupos mediante ofertas con aceptación, rechazo y vencimiento automático.
- Preparar avisos de cupos en el buzón local, con reintentos si falla la entrega.

## Acceso por correo (modo local)

No se utiliza contraseña. Ingresá tu nombre y correo para pedir un enlace. En el modo local elegido, la aplicación **no envía mensajes a tu casilla**: guarda un correo de prueba en `.data/mail/`.

1. Ejecutá `npm run dev` y abrí `http://127.0.0.1:5173`.
2. Abrí un partido o elegí “Ingresar” y pedí un enlace con tu nombre y correo.
3. En otra terminal, desde la raíz del proyecto, ejecutá `npm run mail:latest`.
4. Copiá el enlace del correo y abrilo **en el mismo navegador y con el mismo host donde lo pediste**.
5. Presioná “Confirmar acceso”. Volverás al partido o a la pantalla de origen. Confirmar asistencia sigue siendo una acción explícita.

El enlace vence a los diez minutos y se consume una sola vez. Una cookie temporal lo vincula al navegador que lo pidió. Para acceder desde otro navegador, pedí otro enlace con el mismo correo: se recupera la misma identidad, los mismos partidos y las mismas participaciones. Se pide el nombre en cada solicitud; una cuenta existente conserva su nombre original.

Las sesiones duran treinta días. “Cerrar sesión” revoca la credencial de ese navegador. El correo se muestra únicamente en la sesión privada; los detalles públicos de un partido muestran los nombres de los participantes.

Los tokens de acceso y sesión se guardan como hashes en SQLite. Las cookies son HttpOnly y SameSite=Lax. La verificación se realiza mediante POST después de una confirmación; abrir el enlace no lo consume automáticamente. El token va en el fragmento de la URL y la interfaz lo retira de la barra de direcciones.

Se admite una solicitud por correo cada minuto, hasta cinco por hora, y veinte por IP por hora. Pedir un enlace no crea una cuenta ni inicia sesión. La respuesta no informa si el correo ya estaba registrado ni devuelve el enlace.

### Partidos de la versión anterior

Si todavía conservás la cookie de una sesión anónima, ingresá desde ese navegador y verificá tu correo. Los partidos y participaciones se vinculan a la cuenta. Si el correo ya tiene una cuenta, se combinan las participaciones sin ocupar dos cupos en un mismo partido. Las credenciales anónimas anteriores se revocan al vincularlas.

Una sesión anterior sin cookie no puede recuperarse automáticamente. Ya no está disponible el acceso mediante nombre solamente.

### Configuración y envío real

Los valores opcionales están en `.env.example`. Podés copiarlos a `.env` en la raíz; el servidor carga ese archivo al arrancar. `APP_URL` fija el origen de los enlaces y debe coincidir con la dirección que usás en el navegador. Para desarrollo con Vite, `http://127.0.0.1:5173`; para `npm start`, `http://127.0.0.1:3001`.

`MAIL_DIRECTORY` permite cambiar el buzón local. Los archivos contienen enlaces de acceso y tienen permisos restringidos; `.data/` está excluido del control de versiones. `npm run mail:latest` muestra el último correo de prueba, incluyendo su enlace.

El servicio recibe una interfaz `MagicLinkMailer`; `mail/FileMagicLinkMailer.ts` implementa la entrega local. **Todavía no hay envío SMTP configurado ni implementado.** Para usar correos reales se deben agregar adaptadores para `MagicLinkMailer` y `OfferMailer`, y conectarlos en `bootstrap.ts`. El arranque con `NODE_ENV=production` rechaza el buzón local; con un adaptador real exige HTTPS y activa cookies Secure.

No hay cobros ni datos de pago en esta versión. Las operaciones sobre cupos siguen ejecutándose dentro de una transacción SQLite con una restricción única por partido y persona.

## Lista de espera y ofertas de cupos

En un partido sin cupos libres, una persona identificada puede anotarse en la lista de espera y consultar su posición. El orden se guarda con una secuencia creciente, incluso si dos inscripciones tienen la misma fecha. Repetir la inscripción conserva la posición. Salir y volver a anotarse coloca a la persona al final.

Cuando alguien cancela, el primer jugador en espera recibe una oferta. **El lugar queda reservado y todavía no cuenta como confirmado.** La oferta vence a las dos horas o al comienzo del partido, lo que ocurra primero. La persona puede aceptar o rechazar desde el detalle del partido; también puede salir de la espera mientras tiene una oferta. Rechazar, salir o dejar vencer la oferta libera la reserva para el siguiente.

Los cupos confirmados y reservados se muestran por separado. Los jugadores nuevos no pueden tomar un lugar reservado para otra persona. Si se liberan varios cupos, se generan varias ofertas respetando el orden. Al comenzar el partido se cierran las ofertas y la espera.

### Probar el recorrido local

1. Creá un partido con dos cupos y completalos con dos cuentas distintas.
2. Desde una tercera cuenta, abrí el enlace y elegí “Anotarme en lista de espera”.
3. Cancelá la participación de uno de los confirmados.
4. En unos segundos, consultá el aviso con `npm run mail:offers`.
5. Volvé a la cuenta en espera y abrí el partido: tendrá “Aceptar lugar” y la hora de vencimiento. La pantalla se actualiza cada quince segundos; también podés recargarla.
6. Aceptá para confirmar tu lugar, o rechazá para ofrecerlo al siguiente.

`npm run mail:offers` muestra el último aviso de cupo. `npm run mail:latest` sigue mostrando el último correo de cualquier tipo, incluidos los de acceso. Abrir un aviso de cupo no acepta la oferta; es necesario ingresar con el correo destinatario y elegir “Aceptar lugar”. No hay envíos reales a las casillas en esta entrega.

### Vencimiento y reintentos

Al arrancar, el servidor inicia un proceso que revisa la espera y los avisos cada cinco segundos. **Funciona sin pestañas abiertas mientras el servidor esté ejecutándose.** Las fechas de vencimiento y el orden están persistidos; si el servidor se reinicia, retoma el procesamiento pendiente. Si estuvo apagado, las ofertas vencidas se resuelven al volver a arrancar y no se generan ofertas para partidos que ya comenzaron.

La reserva y el registro del aviso se guardan en una misma transacción. El correo se prepara después de confirmar esa transacción. Los fallos se reintentan con una demora creciente de cinco segundos hasta un máximo de cinco minutos. Se descartan avisos pendientes de ofertas que ya no estén disponibles.

El buzón local usa un archivo estable por aviso y una escritura atómica para evitar correos locales duplicados. Un futuro adaptador de envío real deberá considerar que los reintentos después de una caída pueden implicar entrega al menos una vez.

## Persistencia

La base se crea automáticamente en `.data/busco-player.sqlite`, excluida del control de versiones. Puede elegirse otra ruta con `DATABASE_PATH`; `PORT` cambia el puerto de Express (al cambiarlo, también ajustá el proxy de Vite).

SQLite evita requerir un servicio externo en esta primera entrega. PostgreSQL sigue como propuesta para una siguiente etapa: es una migración real de esquema y consultas, no un simple cambio de URL. Node puede mostrar un aviso de que su módulo SQLite es experimental.

Las fechas se almacenan en UTC y se presentan en la zona horaria del partido. Los importes se guardan como enteros en centésimos; un valor ausente significa “a confirmar” y cero significa gratis.

## Verificar

```bash
npm run check
npm test
npm run build
```

Las pruebas de integración utilizan bases aisladas y HTTP real. Cubren consulta pública, sesiones, permisos de cancelación, último cupo concurrente, idempotencia, persistencia entre reinicios, entradas inválidas y cierre al comenzar el partido.

Prueba manual sugerida:

1. Crear un partido con dos cupos y marcar “Yo también juego”.
2. Copiar el enlace y abrirlo en otro navegador o en una ventana privada.
3. Ingresar con otro correo mediante su enlace local y confirmar: el partido debe quedar completo.
4. Abrir una tercera sesión con otro correo e intentar confirmar: no debe superar los dos cupos.
5. Cancelar desde la segunda sesión y confirmar desde la tercera.
6. Reiniciar la API y recargar: los datos deben continuar.

## API inicial

Todas las respuestas son JSON. Los errores tienen `error` y `code`; la validación agrega `fields`.

| Método | Ruta                                       | Uso                                                                                    |
| ------ | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| GET    | `/api/health`                              | Estado del proceso                                                                     |
| GET    | `/api/session`                             | Identidad actual o null                                                                |
| POST   | `/api/session/request-link`                | Pedir correo con `{ "name": "Pedro", "email": "pedro@example.test", "returnTo": "/" }` |
| POST   | `/api/session/verify`                      | Consumir `{ "token": "..." }` junto con la cookie temporal                             |
| DELETE | `/api/session`                             | Revocar y cerrar la sesión actual                                                      |
| GET    | `/api/matches`                             | Partidos de la sesión; requiere identidad                                              |
| POST   | `/api/matches`                             | Crear partido; requiere identidad                                                      |
| GET    | `/api/matches/:id`                         | Consultar detalle público                                                              |
| PUT    | `/api/matches/:id/participation`           | Confirmar la participación propia                                                      |
| DELETE | `/api/matches/:id/participation`           | Cancelar la participación propia                                                       |
| PUT    | `/api/matches/:id/waitlist`                | Anotarse en la espera; requiere identidad verificada                                   |
| DELETE | `/api/matches/:id/waitlist`                | Salir de la espera o liberar la oferta propia                                          |
| POST   | `/api/matches/:id/offers/:offerId/accept`  | Aceptar una oferta propia vigente                                                      |
| POST   | `/api/matches/:id/offers/:offerId/decline` | Rechazar una oferta propia                                                             |

El esquema de creación está en `packages/contracts/src/index.ts`. `startsAt` es una fecha ISO con zona u offset; `timeZone` es una zona IANA válida; `price` es un entero en centésimos o null.

## Estructura

```text
apps/api/src/          Controllers, services, repositories, modelos y reglas
apps/api/tests/        Pruebas de servicios, base de datos e integración
apps/web/src/          React organizado por funcionalidades (ver apps/web/README.md)
apps/mobile/src/       React Native + Expo: rutas, pantallas, funcionalidades y shared
packages/contracts/   Contratos TypeScript y validación compartida
docs/                Plan de producto
```

La estructura del frontend y el recorrido de sus datos están explicados en [apps/web/README.md](apps/web/README.md). La organización en controllers, services y repositories del backend se explica en [apps/api/README.md](apps/api/README.md).

## Próximas entregas

Envío real de correo; edición y cancelación del partido; repetición; pagos manuales y recordatorios. La base React Native ya está implementada; siguen la validación en dispositivos, enlaces de acceso que abran directamente la app y notificaciones push.

Plan y decisiones iniciales en [docs/plan-inicial.md](docs/plan-inicial.md).
