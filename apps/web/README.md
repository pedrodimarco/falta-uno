# Frontend de Falta uno

React y TypeScript. Se organiza por funcionalidades: los archivos específicos de partidos y sesión viven juntos. Las páginas componen la interfaz; los hooks manejan las operaciones asíncronas; los módulos de API conocen las rutas HTTP.

## Mapa para orientarse

```text
src/
  main.tsx                        Monta React e importa los estilos
  app/
    App.tsx                       Configura router y proveedor de sesión
    AppRoutes.tsx                 Declara las rutas
    AppLayout.tsx                 Encabezado, navegación, pie y Outlet
    RequireSession.tsx            Acceso a funcionalidades con sesión verificada
  pages/
    LandingPage.tsx               Landing promocional pública
    HomePage.tsx                  Mis partidos
    CreateMatchPage.tsx            Pantalla para crear un partido
    MatchDetailPage.tsx           Pantalla de detalle
    LoginPage.tsx                 Acceso por correo
    VerifyLoginPage.tsx           Confirmación y consumo del enlace
    NotFoundPage.tsx              Ruta desconocida
  features/
    session/
      api.ts                      Consultar sesión, pedir enlace, verificar y salir
      SessionContext.ts           Contrato del contexto
      SessionProvider.tsx         Carga sesión y actualiza identidad al verificar/salir
      useSession.ts               Acceso al contexto con validación
      components/
        NameField.tsx             Campo de nombre compartido
        LoginForm.tsx             Solicitud de enlace por correo
        SessionMenu.tsx           Ingreso y cierre de sesión
    matches/
      api.ts                      Consultas y acciones sobre partidos
      formatters.ts               Presentación de fechas y precios
      matchForm.ts                Convierte campos a un MatchInput
      hooks/
        useMyMatches.ts           Lista, carga, error y reintento
        useCreateMatch.ts         Identificación y creación del partido
        useMatch.ts               Detalle, actualización y participación
      components/
        MatchCard.tsx             Resumen para el listado
        MatchForm.tsx             Campos y validación del formulario
        MatchFacts.tsx            Fecha, lugar y costo
        MatchRoster.tsx           Jugadores confirmados
        MatchCapacity.tsx         Cupos y progreso
        MatchParticipation.tsx    Confirmar y cancelar el lugar
        MatchShare.tsx            WhatsApp, copiar y mostrar enlace
        WaitlistRoster.tsx         Orden y ofertas pendientes
        WaitlistActions.tsx        Inscripción y salida de la espera
        OfferActions.tsx           Plazo, aceptación y rechazo de una oferta
  shared/
    api/http.ts                   Fetch, cookies y errores HTTP
    components/                   ErrorNotice y Loading
    utils/errors.ts               Mensajes para errores desconocidos
  styles/
    global.css                    Estilos y reglas adaptables a celular
    landing.css                   Estilos aislados de la landing promocional
```

## Entrada y navegación

`/` muestra la landing promocional basada en `landing.html` de OpenDesign, incluso con sesión iniciada. Comunica «En desarrollo» y «Próximamente»; los botones llevan a información dentro de la propia página. La landing no enlaza a Login ni a las funcionalidades. Presenta como propuesta en desarrollo la opción de organizar partidos públicos (visibles en un listado, con inscripción directa si hay cupo) o privados (por invitación y fuera del listado). El catálogo, la elección de visibilidad y las reglas de acceso privado todavía no están implementados; la aplicación actual sigue usando invitaciones.

El acceso de prueba se abre manualmente en `/ingresar`. Conserva la solicitud y verificación por correo y muestra un aviso de acceso destinado a pruebas. No presenta navegación a partidos antes del acceso. Con sesión iniciada, Login redirige a `/partidos` o al destino permitido indicado en `volver` (por ejemplo `/ingresar?volver=%2Fpartidos%2Fnuevo`). Los enlaces de correo que vuelven a `/` se interpretan como acceso a la agenda; se mantienen los destinos específicos de creación y detalle. Cerrar sesión vuelve a la landing.

`RequireSession` espera la recuperación de sesión y solo monta las rutas `/partidos`, `/partidos/nuevo` y `/partidos/:id` cuando la sesión tiene correo verificado. Sin sesión o con una identidad anterior sin correo, vuelve a `/` sin montar ni consultar el partido. Durante esta etapa, también las invitaciones abiertas directamente en la web requieren sesión; el comportamiento de la API sigue sin modificarse.

La tarjeta de asistencia de la landing es una demostración con estado local: no inscribe a nadie ni persiste datos. El menú móvil y las preguntas frecuentes funcionan con teclado. Los enlaces a secciones usan desplazamiento suave cuando no está activada la preferencia de movimiento reducido.

El pie incluye un formulario de contacto con nombre, email y mensaje, validación nativa de campos obligatorios y formato de correo. El envío está pendiente: al intentar enviar se informa que el mensaje no fue enviado y se conservan los campos. No realiza solicitudes HTTP ni guarda datos en almacenamiento local.

### Restricción real de pruebas: pendiente en backend

El frontend solo controla la presentación y la navegación. **La API actual todavía no limita el ingreso a una lista de cuentas de prueba.** Una sesión verificada sigue siendo suficiente para acceder a las funcionalidades de la web. Quitar los enlaces y redirigir rutas no impide usar la API directamente.

Para cerrar el acceso público falta:

- Configurar en el servidor una lista privada de correos habilitados, con una política explícita para activarla y sin publicarla en variables `VITE_*` o `EXPO_PUBLIC_*`.
- Aplicarla tanto al solicitar como al verificar enlaces, sin crear cuentas, emitir avisos ni generar sesiones para correos no habilitados. Conservar expiración, uso único, vínculo con la solicitud original y límites de solicitudes.
- Comprobar también las sesiones existentes y todos los endpoints de funcionalidades (incluida la lectura pública de detalles mientras dure esta etapa). Una cuenta retirada de la lista debe perder acceso. Cubrir cookies web y Bearer móvil; conservar la posibilidad de cerrar sesión.
- Responder con un rechazo de acceso controlado y un mensaje comprensible para la interfaz. Probar acceso autorizado, denegado, enlaces ya emitidos, sesiones anteriores y clientes que llaman a la API directamente.

El formulario de Login ya muestra los errores que devuelva la API. No se agregó ninguna lista de correos ni autorización simulada en el cliente.

## Por dónde empezar a leer

Para entender la creación de un partido:

1. `app/AppRoutes.tsx` lleva a `pages/CreateMatchPage.tsx`.
2. La página compone `MatchForm` y conecta el resultado con la navegación.
3. `MatchForm` mantiene los valores visuales y llama a `buildMatchInput` para convertir fecha e importe al contrato.
4. `RequireSession` exige una sesión verificada antes de montar la página; `useCreateMatch` maneja creación, espera y errores. Para probar el acceso con regreso a creación, abrir `/ingresar?volver=%2Fpartidos%2Fnuevo` y verificar el enlace.
5. `features/matches/api.ts` define la petición; `shared/api/http.ts` la ejecuta.

Para el detalle, empezar por `pages/MatchDetailPage.tsx`. El hook `useMatch` conserva los datos por partido e identidad, impide acciones duplicadas y descarta respuestas viejas. Al cambiar de cuenta o cerrar sesión, oculta inmediatamente el detalle anterior, cancela su consulta y carga el nuevo estado. Las acciones que ya llegaron al servidor pueden completarse, pero su respuesta no actualiza otra sesión. También limpia el temporizador y el listener de foco al desmontarse. `useMyMatches` vacía datos y errores al cambiar de identidad y deja de cargar al cerrar sesión. Los componentes reciben datos y acciones mediante props. El estado puramente visual (por ejemplo, mostrar el enlace o pedir confirmación antes de cancelar) queda en su componente.

## Convenciones

- Componentes y páginas en PascalCase; hooks con prefijo `use`.
- Un componente exportado por archivo; imports directos para seguir fácilmente las dependencias.
- Los tipos de negocio vienen de `@falta-uno/contracts`; no se duplican en el frontend.
- Las páginas no hacen `fetch`. Los endpoints viven en el `api.ts` de su funcionalidad.
- `shared` contiene solo código común, sin depender de páginas ni funcionalidades.
- El contexto de sesión guarda identidad; los formularios y partidos mantienen su estado donde se utilizan.
- Conservar las rutas, los contratos y las clases CSS al reorganizar, para mantener el comportamiento y el diseño.

## Comandos (desde la raíz del repositorio)

```bash
npm run dev
npm run check
npm test
npm run build
npm run format:web
npm run format:web:check
```

`npm test` ejecuta las pruebas de API, móvil y los hooks web. Para ejecutar solo la regresión web: `npm run test -w @falta-uno/web`. Estas pruebas montan los hooks con React y jsdom, controlan las respuestas HTTP y cubren ingreso, salida, cambio de cuenta, consultas y acciones tardías, errores, conflictos, cambio de partido y StrictMode. No reemplazan una suite completa de navegación. Para verificar cambios del frontend, recorrer creación, detalle, cancelación, confirmación, listado y copia del enlace en el navegador. El README de la raíz documenta el acceso por correo, la lectura del buzón local y las limitaciones de esta entrega. La verificación del enlace es una acción explícita: abrir el correo no ejecuta el POST de acceso; el usuario presiona “Confirmar acceso”.

## Estados de espera

El detalle distingue `confirmed` de `reserved`. La espera pública contiene nombres, posiciones y ofertas pendientes, sin direcciones de correo ni identificadores de ofertas ajenas. `offer` solo se devuelve al destinatario autenticado.

`MatchParticipation` compone las acciones según el estado personal. `WaitlistActions` permite inscribirse y salir; `OfferActions` muestra el plazo y exige una decisión explícita. La cuenta regresiva solo orienta al jugador: el servidor decide si una oferta sigue vigente. Las acciones usan el mismo manejo de espera y errores de `useMatch` y vuelven a consultar el detalle ante un conflicto.

## Gestión del organizador

`MatchManagement` compone `MatchEditor` y `AddPlayerForm` desde el detalle. Solo aparece para el organizador; el servidor valida los permisos nuevamente. El editor conserva una instantánea y su versión: el refresco no pisa el borrador y una edición concurrente requiere cargar explícitamente los datos nuevos. La conversión de hora en zona IANA y centésimos vive en `@falta-uno/contracts`, compartida con móvil.

Se agregan cuentas por correo exacto o invitados por nombre con un UUID estable para reintentos. Las bajas requieren confirmación y conservan el orden de espera. Las acciones reutilizan el estado y el aislamiento de sesión de `useMatch`. Las pruebas jsdom también cubren visibilidad del panel, envío de versión y conservación/recarga del borrador. La política completa de plazos y cupos está en el [README raíz](../../README.md#gestión-del-organizador).
