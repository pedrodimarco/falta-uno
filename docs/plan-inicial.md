# Falta uno — primera versión

Estado: primera entrega local implementada. React + Express + TypeScript, persistencia SQLite y acceso por correo mediante enlaces de un solo uso, con buzón local de desarrollo. Ya existe el primer cliente React Native con Expo, conectado a la misma API. Ver README.md para ejecución y límites. PostgreSQL y la validación móvil en dispositivos siguen pendientes.

## Objetivo

Organizar partidos entre amigos mediante enlaces compartidos por WhatsApp. Primer caso: fútbol 5 semanal, diez jugadores. El deporte y los cupos son configurables para admitir pádel y básquet.

## Decisiones acordadas

- Empezar por grupos de amigos; descubrimiento de jugadores y canchas queda para después.
- Crear partido, compartir enlace, confirmar asistencia y cubrir bajas mediante una lista de espera.
- Consultar sin cuenta; identificar a la persona al confirmar.
- Tres pantallas principales: mis partidos, crear partido y detalle del partido.
- Stack solicitado: Node.js con Express, React y React Native.

## Arquitectura propuesta

Primero se implementó la web adaptable a celular en React y una API REST en Node.js y Express. Ahora React Native con Expo es el segundo cliente de esa API; comparte contratos, identidad y reglas del servidor.

TypeScript y Vite ya están implementados. La persistencia actual es SQLite; PostgreSQL sigue como propuesta futura.

Estructura actual:

```text
apps/
  api/             Node.js + Express
  web/             React
  mobile/          React Native + Expo, primer recorrido conectado
packages/
  contracts/       Tipos y esquemas de solicitudes y respuestas
docs/
```

Compartir contratos y lógica que no dependa de la plataforma. Diseñar las pantallas web y nativas para sus respectivos componentes. El servidor es la autoridad sobre cupos, permisos, pagos y orden de espera. Los contratos compartidos no reemplazan la validación del servidor.

Mantener un único backend organizado por funciones (partidos, participantes, identidad). No hacen falta microservicios para este alcance.

## Detalle del partido

Orden del contenido en celular:

1. Deporte, nombre y estado del partido.
2. Fecha, horario, cancha y costo por persona.
3. Cupos confirmados y disponibles.
4. Estado personal y acción principal.
5. Jugadores confirmados y lista de espera.
6. Notas y nombre del organizador.

Estados personales: visitante, confirmado, en espera, con lugar ofrecido. El estado del partido (abierto, completo, cancelado, finalizado) se determina por separado. Un cupo ofrecido cuenta como reservado hasta que se acepta o vence.

La entrega actual persiste partidos e identidades y ofrece gestión del organizador en web y móvil. El correo usa un buzón local, sin envíos reales; no procesa pagos ni reserva canchas.

## Reglas del primer flujo funcional

- Cada persona tiene como máximo una participación activa por partido.
- Los confirmados no pueden superar los cupos. El servidor debe resolver de forma atómica los intentos simultáneos de tomar el último lugar.
- Repetir una confirmación o una cancelación no debe duplicar inscripciones ni liberar dos veces un cupo.
- El organizador puede participar y agregar personas manualmente; estas también ocupan cupos.
- Al cancelar, se ofrece el cupo al primero en espera y se reserva hasta su vencimiento.
- Plazo acordado e implementado: treinta minutos o hasta el comienzo del partido, lo que ocurra antes.
- Aceptar y vencer una oferta al mismo tiempo debe tener un único resultado, decidido por el servidor.
- Al comenzar el partido se cierran nuevas inscripciones y ofertas.
- Cancelar el partido invalida las ofertas pendientes y bloquea nuevas confirmaciones.
- Solo el organizador administra pagos y edita o cancela el partido.
- Pagos manuales separados de la asistencia: pendiente o pagado; el jugador solo consulta el suyo.
- Repetir un partido copia su configuración, nunca sus confirmaciones.
- Antes de reducir cupos o cambiar horario, resolver el efecto sobre confirmados y ofertas existentes.

## Datos iniciales

- Persona: identidad y nombre visible.
- Partido: organizador, deporte, título, fecha y hora, zona horaria, lugar, cupos, costo opcional, moneda, notas y estado.
- Participación: partido, persona o invitado manual, estado y fecha de inscripción. El orden de espera es estable, con desempate explícito.
- Oferta de lugar: participación, emisión, vencimiento y resolución.
- Pago manual: participación y estado, conservando el registro si alguien cancela.

## Entregas pequeñas

1. Validar el detalle y sus estados con un prototipo.
2. React: detalle con datos ficticios y navegación básica.
3. Express y persistencia: crear, consultar, confirmar y cancelar; conectar React.
4. Identidad y permisos: acceso por correo con enlaces de un solo uso implementado en modo local. Incluye vinculación de sesiones anteriores y recuperación de la misma cuenta entre navegadores. El envío real de correo queda pendiente.
5. Espera, ofertas y vencimiento automático implementados con proceso del servidor y buzón local de avisos. El canal de correo real sigue pendiente; compartir por WhatsApp no implica notificaciones automáticas de WhatsApp.
6. Mis partidos, repetición, pagos manuales y recordatorios.
7. Prueba con organizadores reales y ajustes.
8. Cliente React Native que reutilice la API: base implementada con acceso por correo, creación y consulta de partidos, participación, espera y ofertas. Pendientes prueba en dispositivos, enlaces del correo que abran directamente la app y notificaciones push. Preparación en `apps/mobile/README.md`.

## Criterios de aceptación del primer corte conectado

- El organizador crea un partido y obtiene un enlace consultable desde otro navegador.
- Dos jugadores ven las mismas confirmaciones persistidas, incluso tras recargar.
- Dos solicitudes simultáneas al último cupo producen una sola confirmación.
- Una persona puede cancelar su lugar hasta una hora antes. El organizador puede quitar jugadores hasta el inicio.
- Los estados de carga, falta de conexión, enlace inválido y partido cancelado tienen respuestas visibles.

## Valor para el portfolio

Demostrar un recorrido completo con decisiones explicadas: API documentada, permisos, persistencia, manejo de concurrencia y accesibilidad. Probar especialmente el último cupo, solicitudes repetidas y vencimiento de ofertas. Agregar instrucciones de ejecución y una demo al tener la primera entrega funcional.

## Referencias técnicas

- Express: https://expressjs.com/
- React, creación desde cero y Vite: https://react.dev/learn/build-a-react-app-from-scratch
- React Native, componentes nativos: https://reactnative.dev/docs/intro-react-native-components

## Requisitos aclarados y estado actual

- **Acceso:** cualquier persona puede consultar por enlace todos los detalles públicos, incluidos nombres, horario y lugar. Para anotarse necesita acceso verificado. El listado público de próximos encuentros desde el inicio es parte del producto final y sigue pendiente; hoy se muestran los partidos de la sesión.
- **Visibilidad propuesta:** al organizar se podrá elegir un partido público o privado. Los públicos aparecerán en un listado de encuentros abiertos y permitirán confirmar asistencia directamente si hay cupo; los privados se compartirán por invitación y no aparecerán en ese listado. Esta distinción y el catálogo siguen pendientes de implementación. La landing los comunica como parte del producto en desarrollo.
- **Actores:** visitante consulta; jugador verificado confirma, cancela su lugar y usa la espera; organizador además edita todos los datos mutables y agrega/quita cuentas o invitados. Un invitado sin cuenta no tiene sesión propia.
- **Plantel implementado:** altas manuales de confirmados con cupo, búsqueda de cuenta por correo exacto o invitado por nombre; bajas de confirmados y espera, sin reordenamiento manual. No se saltean reservas de terceros.
- **Plazos implementados:** baja propia hasta una hora antes, inclusive; gestión del organizador hasta el inicio; ofertas hasta treinta minutos o el inicio. Adelantar un encuentro puede acortar ofertas; posponerlo no extiende las existentes.
- **Edición implementada:** no reduce capacidad por debajo de confirmados más reservas; conserva plantel e identidades. Una versión evita sobrescrituras entre pantallas. Las fechas ambiguas o inexistentes por cambio de horario se rechazan en el formulario.
- **Integridad:** permisos y reglas se aplican en el servidor, con transacciones, idempotencia y migraciones que conservan datos. Las pruebas cubren acceso ajeno, cierre, concurrencia, reservas, rollback y reinicio.
- **Cancelación del encuentro:** política acordada de hasta dos horas antes; funcionalidad pendiente. Ausencias y bajas de último momento siguen sin política definida.
- **Costos:** importe por persona implementado. Total de cancha y desglose de comisión, luz y extras quedan pendientes, al igual que pagos.
- **Validación del producto:** observar creación de partidos, exposición y altas de confirmados/espera. Aún no se instrumentan eventos o métricas para medirlo ni se ha validado con usuarios reales.
- **Pendientes de decisión:** vinculación futura de invitados con cuentas y comunicaciones al editar o quitar personas. Actualmente los cambios se consultan en el detalle; no generan avisos automáticos.
