# Instrucciones para agentes — Falta uno

Estas instrucciones aplican a todo el repositorio. Respetá las instrucciones explícitas del usuario y las instrucciones más específicas de los directorios que modifiques. Mantené este archivo breve y actualizado cuando cambien las convenciones; no lo uses como historial de tareas.

## Producto y forma de trabajar

- Falta uno organiza partidos entre amigos: invitaciones, asistencia, cupos, lista de espera y ofertas de lugares. La primera entrega funciona en desarrollo local.
- El proyecto también tiene un objetivo de aprendizaje y portfolio en Node.js, Express, React y React Native. Priorizá código claro, responsabilidades visibles y decisiones explicables.
- Comunicá avances y resultados en español. Conservá los identificadores de código en inglés y los textos de la aplicación en español rioplatense.
- Revisá el estado de Git antes de editar y preservá cambios existentes, incluidos los de otros agentes. Limitá el diff al pedido; no reformatees ni reorganices archivos ajenos a la tarea.
- Avanzá con las decisiones rutinarias y las verificaciones locales ya autorizadas. Si el pedido es solo analizar o revisar, no edites. Los commits, pushes y despliegues no son un efecto implícito de una edición local: realizalos cuando el usuario los solicite.

## Organización y referencias

Monorepo con npm workspaces; ejecutá los comandos desde la raíz. Los paquetes internos usan el scope `@falta-uno`, no `@busco`.

| Ubicación                  | Responsabilidad y referencia                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api`                 | Express, casos de uso y SQLite. Consultá [su README](apps/api/README.md) para los límites entre capas.                             |
| `apps/web`                 | React y Vite. Consultá [su README](apps/web/README.md) para componentes, hooks y regresiones de sesión.                            |
| `apps/mobile`              | React Native con Expo y Expo Router. Consultá [su README](apps/mobile/README.md) para red local, sesión y pruebas en dispositivos. |
| `packages/contracts`       | Tipos TypeScript y esquemas Zod compartidos por API, web y móvil.                                                                  |
| `.github/workflows/ci.yml` | Comandos y entorno del CI.                                                                                                         |

El [README raíz](README.md) documenta ejecución y alcance; [el plan de producto](docs/plan-inicial.md) distingue lo implementado de lo propuesto. Leé las referencias pertinentes al cambio, sin cargar toda la documentación para tareas pequeñas. Si hay discrepancias, contrastá el código, los scripts y la documentación antes de asumir que una función existe.

## Límites de arquitectura

- Conservá por defecto el monorepo, TypeScript, Express, SQLite y el worker en el proceso de la API. Introducí cambios de infraestructura o dependencias cuando la tarea los justifique y explicá su impacto; evitá capas genéricas sin una necesidad concreta.
- Backend: `routes → controllers → services → repositories`. Los controllers validan entrada y manejan HTTP; los services coordinan casos de uso mediante interfaces; el SQL y el mapeo de filas viven en `repositories/sqlite`.
- `models` y `rules` representan el dominio sin Express, SQLite ni Zod. Los services tampoco dependen de Request/Response o de implementaciones concretas de persistencia. `bootstrap.ts` conecta repositorios, transacciones, correo, reloj e identificadores.
- Web: las páginas componen la interfaz; los hooks coordinan estado y operaciones; `features/*/api.ts` define endpoints y `shared/api/http.ts` ejecuta HTTP. `main.tsx` sigue siendo un punto de entrada pequeño.
- Móvil: `src/app` declara rutas y providers; `screens` compone pantallas; `features` contiene hooks, componentes y acceso a la API. No importes HTML, CSS ni componentes de la web para construir la interfaz nativa.
- Compartí contratos y funciones puras con un significado común. Mantené específicos de cada plataforma el almacenamiento, la navegación y los controles visuales. `shared` no depende de páginas o funcionalidades.
- Evaluá cambios de contratos contra API, web y móvil. Conservá compatibilidad con clientes móviles instalados: un cambio de backend no actualiza automáticamente las aplicaciones existentes.

## Integridad de datos y reglas críticas

- El servidor decide permisos, cupos y vencimientos. La validación del cliente y las cuentas regresivas solo orientan la interacción.
- Confirmados más reservas vigentes no pueden superar la capacidad. La lectura del estado, su validación y la escritura deben ser atómicas. Mantené restricciones únicas e idempotencia ante solicitudes repetidas o concurrentes.
- Las ofertas respetan el orden persistido de espera, pertenecen a una persona y se resuelven por su ID exacto. Una decisión sobre una oferta anterior no puede modificar una oferta nueva. Al comenzar el partido se cierran inscripciones y ofertas; la política de plazo está en `rules/waitlistRules.ts`.
- Los repositorios y `TransactionManager.run` son síncronos con `node:sqlite`. Nunca uses callbacks `async` ni esperas de red dentro de esa transacción. `reconcileInTransaction` se llama dentro de una transacción ya abierta.
- Persistí la oferta y su aviso en la misma transacción; enviá el correo después. Conservá reintentos, leases y escrituras locales idempotentes al modificar notificaciones.
- Fechas en UTC, presentación en la zona IANA del partido. Importes en centésimos enteros: `null` significa costo a confirmar y `0` significa gratis.
- Preservá datos existentes al evolucionar el esquema. El proyecto aún no tiene migraciones versionadas: `CREATE TABLE IF NOT EXISTS` no modifica columnas existentes. Un cambio de esquema debe contemplar la actualización de bases anteriores y probar que conserva sus datos.
- El directorio del proyecto y el archivo SQLite conservan nombres históricos de Busco Player. No renombres archivos de datos, cookies o identificadores persistidos solo para actualizar la marca.

## Identidad, privacidad y estado de los clientes

- El acceso actual es por enlace de correo de un solo uso, ligado a la solicitud original. Nombre y correo por sí solos no autentican. Conservá expiración, límites de solicitudes, hashes de tokens y revocación de sesiones.
- Web usa cookies HttpOnly; móvil usa Bearer y SecureStore. Ambos recuperan la misma cuenta mediante `SessionService`. Una cabecera Authorization inválida no debe caer a una cookie como alternativa.
- Las vistas públicas no exponen correos, tokens ni IDs de ofertas ajenas. No registres secretos ni enlaces de acceso en logs, commits o informes. Las variables `EXPO_PUBLIC_*` se incluyen en el bundle: nunca contienen secretos.
- Los datos de un partido pertenecen al partido **y** a la identidad que los consultó. Al ingresar, salir o cambiar de cuenta, ocultá el estado anterior y recargá el correspondiente. Descartá respuestas tardías de consultas y acciones, incluidos errores y cambios de `pending`.
- Cancelar una consulta no garantiza que una acción ya enviada se haya deshecho en el servidor. Conservá ese comportamiento al manejar cambios de sesión, desmontajes y reintentos.
- El correo sigue en modo local por decisión del proyecto. Conservá los adaptadores y controles de producción existentes; una tarea local no implica habilitar envíos reales.

## Entorno y comandos

Usá npm y la versión de Node de `.nvmrc`; el mínimo admitido está en `package.json`. Al cambiar dependencias, actualizá manifiesto y lockfile juntos. Conservá la compatibilidad de Expo con React, React Native, Reanimated y Worklets, incluidos los overrides raíz; no apliques `npm audit fix --force` como arreglo automático.

| Objetivo                                   | Comando desde la raíz                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Desarrollo API y web                       | `npm run dev`                                                                                            |
| Desarrollo móvil                           | `npm run dev:mobile`                                                                                     |
| Comprobar tipos de los workspaces          | `npm run check`                                                                                          |
| Ejecutar todas las suites                  | `npm test`                                                                                               |
| Suite de una aplicación                    | `npm run test -w @falta-uno/api`, `npm run test -w @falta-uno/web` o `npm run test -w @falta-uno/mobile` |
| Compilar web con comprobación de tipos     | `npm run build`                                                                                          |
| Compilar solo web, si ya comprobaste tipos | `npm run build -w @falta-uno/web`                                                                        |
| Exportar bundles Android/iOS               | `npm run mobile:export`                                                                                  |

El CI ejecuta `npm ci`, `npm run check`, `npm test` y la compilación del workspace web. `npm ci` reemplaza `node_modules`: si hay servidores de desarrollo activos, verificá la instalación limpia en una copia temporal sin `.env`, `.data` ni credenciales.

## Verificación según el cambio

- Agregá pruebas de regresión para defectos funcionales y reglas nuevas. Priorizá resultados observables: permisos, último cupo, idempotencia, rollback, vencimientos y aislamiento entre sesiones; evitá pruebas que solo repitan la implementación.
- Ejecutá primero las pruebas de la aplicación afectada. Ante cambios compartidos o de contratos, ejecutá las tres suites y la comprobación de tipos. Para una entrega de código que afecte el recorrido completo, reproducí los controles del CI.
- Usá las fixtures existentes, bases en memoria o temporales, mailers de prueba y relojes inyectados. Las pruebas locales son descartables y no acceden a producción; no reutilices `.data` ni un `.env` personal. Cerrá servidores, conexiones y temporizadores que abras para verificar.
- La suite web monta hooks con React y jsdom; no equivale a pruebas completas de navegación. Exportar bundles de Expo no demuestra ejecución nativa: diferenciá comprobación de tipos, bundles y prueba real en dispositivo.
- Solo documentación: verificá enlaces, comandos pertinentes y formato; no hace falta ejecutar las suites por una edición de Markdown. Para configuración de CI o instalación, comprobá su sintaxis y reproducí los pasos afectados.
- Aplicá Prettier a los archivos modificados (`npx prettier --check <archivos>`). Hay scripts `format:api:check`, `format:web:check` y `format:mobile:check` para revisar un workspace. No hay un script de lint general; no inventes uno en los informes.
- Si una restricción del entorno impide una comprobación, informá qué quedó pendiente; un proceso que no ejecutó los casos no cuenta como una suite aprobada. No confundas permisos del sandbox con errores del producto.

## Cierre de la tarea

Actualizá el README correspondiente si cambia un comando, contrato o comportamiento documentado. Explicá qué cambió, por qué, qué verificaste y las limitaciones relevantes. Distinguí una validación local de una ejecución de CI en GitHub y el trabajo implementado de los próximos pasos propuestos.
