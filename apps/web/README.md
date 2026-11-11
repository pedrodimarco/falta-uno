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
  pages/
    HomePage.tsx                  Inicio y mis partidos
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
```

## Por dónde empezar a leer

Para entender la creación de un partido:

1. `app/AppRoutes.tsx` lleva a `pages/CreateMatchPage.tsx`.
2. La página compone `MatchForm` y conecta el resultado con la navegación.
3. `MatchForm` mantiene los valores visuales y llama a `buildMatchInput` para convertir fecha e importe al contrato.
4. `useCreateMatch` exige una sesión verificada y maneja creación, espera y errores. Si falta acceso, la página muestra `LoginForm` y vuelve a esa pantalla después de verificar el enlace.
5. `features/matches/api.ts` define la petición; `shared/api/http.ts` la ejecuta.

Para el detalle, empezar por `pages/MatchDetailPage.tsx`. El hook `useMatch` conserva los datos, impide acciones duplicadas y descarta respuestas viejas; también limpia el temporizador y el listener de foco al desmontarse. Los componentes reciben datos y acciones mediante props. El estado puramente visual (por ejemplo, mostrar el enlace o pedir confirmación antes de cancelar) queda en su componente.

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

`npm test` ejecuta las pruebas de integración de la API; todavía no hay una suite automatizada de interfaz. Para verificar cambios del frontend, recorrer creación, detalle, cancelación, confirmación, listado y copia del enlace en el navegador. El README de la raíz documenta el acceso por correo, la lectura del buzón local y las limitaciones de esta entrega. La verificación del enlace es una acción explícita: abrir el correo no ejecuta el POST de acceso; el usuario presiona “Confirmar acceso”.

## Estados de espera

El detalle distingue `confirmed` de `reserved`. La espera pública contiene nombres, posiciones y ofertas pendientes, sin direcciones de correo ni identificadores de ofertas ajenas. `offer` solo se devuelve al destinatario autenticado.

`MatchParticipation` compone las acciones según el estado personal. `WaitlistActions` permite inscribirse y salir; `OfferActions` muestra el plazo y exige una decisión explícita. La cuenta regresiva solo orienta al jugador: el servidor decide si una oferta sigue vigente. Las acciones usan el mismo manejo de espera y errores de `useMatch` y vuelven a consultar el detalle ante un conflicto.
