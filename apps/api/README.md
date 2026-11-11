# Backend de Falta uno

Node.js, Express y TypeScript, organizado en controllers, services y repositories. Las responsabilidades y las dependencias siguen separadas; `src/bootstrap.ts` conecta las implementaciones concretas.

## Mapa para orientarse

```text
src/
  controllers/
    matchController.ts              Valida solicitudes y responde sobre partidos
    sessionController.ts            Valida solicitudes y responde sobre sesiones
    waitlistController.ts           Inscripción, salida, aceptación y rechazo
  routes/
    matchRoutes.ts                  URLs de partidos y participación
    sessionRoutes.ts                URLs de sesión
  middlewares/
    resolveSession.ts               Recupera la identidad desde la cookie
    requestContext.ts               Identidad tipada y acceso requerido
    security.ts                     Cabeceras y validación del origen
    errorHandler.ts                 Traduce errores a respuestas HTTP
  services/
    MatchService.ts                 Crear, consultar, confirmar y cancelar
    SessionService.ts               Pedir y verificar enlaces; recuperar y cerrar sesiones
    WaitlistService.ts              Orden, reservas, ofertas y vencimientos
    OfferNotificationService.ts     Entrega con lease y reintentos
    matchViews.ts                   Construye las vistas de lectura
    interfaces/
      MatchUseCases.ts              Contrato del servicio de partidos
      SessionUseCases.ts            Contrato, duración de sesión y enlace
      MagicLinkMailer.ts            Interfaz de entrega del correo
      dependencies.ts               Interfaces de transacciones, reloj, IDs y tokens
  repositories/
    interfaces/
      MatchRepository.ts            Operaciones de persistencia de partidos
      SessionRepository.ts          Cuentas, sesiones y vinculación anterior
      WaitlistRepository.ts         Entradas y estados de la lista
      OfferNotificationRepository.ts Avisos pendientes de oferta
      LoginLinkRepository.ts        Enlaces de acceso y límites de solicitud
    sqlite/
      SqliteMatchRepository.ts      SQL de partidos y participantes
      SqliteSessionRepository.ts    SQL de cuentas, personas y sesiones
      SqliteLoginLinkRepository.ts  SQL de enlaces y límites de solicitud
      rowMappers.ts                 Convierte filas SQL a modelos
  models/
    Match.ts                        Modelos de partidos
    Person.ts                       Persona pública y sesión privada
    LoginLink.ts                    Enlace de acceso y vínculo con el navegador
  rules/
    matchRules.ts                   Reglas de fecha, cierre y cupos
    authRules.ts                    Destinos de retorno internos permitidos
  database/
    connection.ts                   Abre y configura la conexión SQLite
    schema.ts                       Esquema inicial compatible con la base previa
    SqliteTransactionManager.ts     BEGIN IMMEDIATE, COMMIT y ROLLBACK
  config/
    environment.ts                  Lee y valida la configuración del entorno
  errors/
    DomainError.ts                  Errores de negocio, sin estados HTTP
    HttpError.ts                    Errores propios del transporte HTTP
  security/
    CryptoSessionTokens.ts          Generación y hash de tokens con Node crypto
    sessionCookie.ts                Lectura y configuración de cookies
  mail/
    FileMagicLinkMailer.ts           Buzón local con permisos restringidos
    FileOfferMailer.ts               Avisos locales idempotentes de cupos
  jobs/
    WaitlistWorker.ts                Procesamiento al inicio y cada cinco segundos
  app.ts                            Configura Express, middleware y rutas
  bootstrap.ts                      Construye e inyecta dependencias
  server.ts                         Arranca el servidor y cierra los recursos
tests/
  services/                         Servicios sin Express ni SQLite
  database/                         Transacciones reales y rollback en SQLite
  integration/                      Contratos y recorrido completo mediante HTTP
  helpers/                          Servidor de prueba, reloj y repositorio en memoria
```

## Por dónde empezar a leer

Para seguir una confirmación de lugar:

1. `routes/matchRoutes.ts` asocia `PUT /api/matches/:id/participation` con el controlador.
2. `middlewares/resolveSession.ts` recupera la identidad desde la cookie.
3. `controllers/matchController.ts` exige esa identidad y llama al contrato `MatchUseCases`.
4. `services/MatchService.ts` abre una transacción, consulta el partido y aplica las reglas de `rules/matchRules.ts`.
5. `repositories/sqlite/SqliteMatchRepository.ts` realiza las consultas y la inscripción.
6. El servicio construye la vista de salida y el controlador la devuelve como JSON.

El recorrido es **ruta → controller → service → repository**. El chequeo del último cupo y su ocupación siguen dentro de la misma transacción.

## Responsabilidades y dependencias

- **Controllers:** validan el formato de entrada con `@falta-uno/contracts`, llaman a los servicios mediante sus interfaces y devuelven respuestas. No ejecutan SQL.
- **Services:** coordinan las operaciones. Reciben repositorios, transacciones, reloj, generador de IDs y proveedor de tokens mediante el constructor. No importan Express ni las implementaciones de SQLite.
- **Repositories:** sus interfaces describen las operaciones que necesitan los servicios; las implementaciones SQLite contienen el SQL y el mapeo de filas. No deciden las reglas de cupos o cierre.
- **Models y rules:** representan los datos y las reglas del negocio. No dependen de Express, SQLite ni Zod.
- **Middlewares:** manejan aspectos comunes de HTTP, como identidad, origen y errores. Traducen los códigos de negocio a estados HTTP.
- **Database:** contiene la conexión, el esquema y las transacciones concretas de SQLite.
- **Bootstrap:** selecciona las implementaciones y las conecta. Los repositorios y el gestor de transacciones comparten la conexión.

Las interfaces de servicio están en `services/interfaces`; las de repositorio, en `repositories/interfaces`. Los controladores dependen de las primeras y los servicios dependen de las segundas. Esto permite probar los servicios con un repositorio en memoria y un reloj controlado.

La configuración se lee una vez al arrancar. `createApp` no abre bases de datos ni escucha puertos. `createApplication` crea los recursos y devuelve `close()`; `server.ts` conecta ese cierre con las señales del proceso.

## Decisiones de esta entrega

Las interfaces de repositorio y transacciones son **síncronas**, en consonancia con `node:sqlite` y `DatabaseSync`. No usar callbacks asíncronos dentro de `TransactionManager.run`. Una futura migración a un driver asíncrono de PostgreSQL requerirá adaptar esos contratos y la coordinación transaccional, además de implementar el nuevo repositorio.

Las validaciones de formato se realizan en los controladores; las reglas de fecha y cupos, en `rules`. Los servicios reciben comandos ya validados. Sus resultados no contienen objetos Request/Response ni códigos HTTP.

El esquema se amplía de forma aditiva con `email_accounts`, `login_links` y `auth_requests`; las tablas anteriores no se eliminan. Las sesiones anónimas pueden vincularse después de verificar el correo desde su navegador original. La política de vinculación combina organización y participaciones dentro de una transacción y evita duplicar cupos.

El acceso sin contraseña usa `POST /api/session/request-link` y `POST /api/session/verify`. La solicitud realiza una transacción corta para registrar el enlace y los límites; luego espera a `MagicLinkMailer.send` fuera de la transacción. La verificación y la creación de la sesión son atómicas. Un fallo de verificación revierte el consumo del enlace junto con cualquier cambio de identidad.

`MagicLinkMailer` es asíncrono porque representa la entrega del correo; los repositorios siguen siendo síncronos. En esta entrega solo se implementa el buzón local, sin envío real. La interfaz y el punto de inyección permiten agregar SMTP sin incluir detalles de transporte en `SessionService`.

El nombre y correo no autentican por sí solos. El enlace requiere la cookie temporal del navegador solicitante, vence a los diez minutos y se consume una vez. El token se envía en el fragmento de una URL construida con `APP_URL`, nunca con el encabezado Host del request. El servicio normaliza el correo y conserva una identidad por dirección. Los correos no se incluyen en las vistas públicas de los partidos.

La configuración y el recorrido para abrir el correo local están en el README de la raíz. El buzón local queda bloqueado en producción. El diseño de tokens y sesiones toma como referencia las recomendaciones de [OWASP sobre tokens de un solo uso](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) y [gestión de sesiones](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## Comandos desde la raíz

```bash
npm run dev
npm run mail:latest
npm run check
npm test
npm run build
npm run format:api
npm run format:api:check
```

Las pruebas cubren servicios con dependencias de memoria, vencimiento de sesiones, rollback de operaciones parciales, concurrencia del último cupo, cancelación propia, idempotencia, contratos HTTP y persistencia tras reabrir la base. El cierre del partido se prueba con un reloj inyectado, sin modificar tablas desde las pruebas HTTP ni esperar al reloj real.

## Coordinación de la lista de espera

`MatchService` recibe `WaitlistCoordinator`. Al confirmar o cancelar, llama a `reconcileInTransaction` dentro de la misma transacción de cupos. La coordinación resuelve ofertas vencidas, elimina esperas de personas ya confirmadas y asigna lugares libres por secuencia. Una confirmación directa considera tanto participantes como reservas.

`WaitlistService` también expone los casos de uso de espera. Cada aceptación se dirige a un ID de oferta y a la identidad de la sesión. Repetir una aceptación no crea una segunda participación; repetir una decisión anterior no altera una oferta posterior. Las acciones de otra persona reciben un error sin revelar la oferta ajena.

`waitlist_entries` conserva el historial y tiene una restricción única parcial por partido y persona para los estados activos. `offer_notifications` registra cada aviso en la misma transacción que crea la oferta. Las tablas anteriores se conservan.

`OfferNotificationService` reclama avisos con un lease de sesenta segundos y una clave de propietario. Realiza el envío fuera de la transacción y marca el resultado después. Un lease vencido permite retomar una entrega tras una caída. Se reintentan fallos con espera creciente y se descartan ofertas no accionables. El buzón local escribe de forma atómica y usa el ID del aviso para impedir archivos duplicados.

`server.ts` inicia `WaitlistWorker` cuando el servidor empieza a escuchar. `bootstrap.ts` expone `startBackgroundJobs`, `runMaintenance` y un `close` asíncrono que detiene el temporizador y espera la tarea activa antes de cerrar SQLite. Las pruebas no arrancan temporizadores salvo cuando verifican explícitamente el proceso de fondo.

El plazo de dos horas y su límite al comienzo del partido están en `rules/waitlistRules.ts`. Las pruebas controlan el reloj, por lo que verifican el vencimiento sin esperar dos horas. Incluyen orden, varias bajas, concurrencia, permisos, rollback, reintentos, leases y reinicio del proceso.

## Cliente React Native

`/api/mobile/session` agrega un transporte nativo sobre el mismo `SessionService`:

- `POST /request-link`: recibe el mismo nombre/correo, prepara el correo y devuelve únicamente `flowToken` y `localMail`.
- `POST /verify`: recibe `{token, flowToken}` y devuelve la persona y el secreto de sesión tras validar el correo.
- `GET /`: consulta la identidad del Bearer.
- `DELETE /`: revoca esa sesión, sin modificar cookies de otros clientes.

Las rutas de partidos aceptan `Authorization: Bearer …` o la cookie web existente. Si hay Authorization inválida, nunca se usa una cookie como alternativa. Las credenciales siguen persistidas como hashes, con vencimiento y revocación existentes. Los endpoints web no devuelven secretos de sesión.

`HOST` permite elegir la interfaz de escucha; se conserva `127.0.0.1` por defecto. Para el teléfono en desarrollo se usa `HOST=0.0.0.0`. El middleware permite CORS exclusivamente para los orígenes locales configurados, incluidos 8081 y 5173. La conexión nativa no requiere CORS.

Preparación del teléfono y estructura de la app en [../mobile/README.md](../mobile/README.md).
