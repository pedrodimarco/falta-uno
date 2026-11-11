interface Tasks {
  processPending(): void;
  dispatchPending(): Promise<void>;
}
/** Corre en el servidor, sin depender de pestañas abiertas o visitas a la API. */
export class WaitlistWorker {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running: Promise<void> | null = null;
  constructor(
    private readonly tasks: Tasks,
    private readonly intervalMs = 5_000,
  ) {}
  runOnce(): Promise<void> {
    if (this.running) return this.running;
    this.running = (async () => {
      this.tasks.processPending();
      await this.tasks.dispatchPending();
    })().finally(() => {
      this.running = null;
    });
    return this.running;
  }
  start(): void {
    if (this.timer) return;
    const tick = () => {
      void this.runOnce().catch((error) =>
        console.error("No se pudo procesar la lista de espera:", error),
      );
    };
    tick();
    this.timer = setInterval(tick, this.intervalMs);
    this.timer.unref();
  }
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.running;
  }
}
