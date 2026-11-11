/** Solo se permite volver a pantallas propias y conocidas de la aplicación. */
export function safeReturnPath(value: string): string {
  return /^(\/|\/partidos\/(nuevo|[a-f0-9-]{36}))$/.test(value) ? value : "/";
}
