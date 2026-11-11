import { createApplication } from "./bootstrap.ts";
import { loadConfig, loadEnvironmentFile } from "./config/environment.ts";

loadEnvironmentFile();
const config = loadConfig();
const { host, port } = config;
const application = createApplication(config);

const server = application.app.listen(port, host, () => {
  application.startBackgroundJobs();
  console.log(`Falta uno API: http://${host}:${port}`);
});

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  server.close(() => {
    void application
      .close()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  });
}

server.on("error", (error) => {
  console.error(error);
  void application.close().catch(console.error);
  process.exitCode = 1;
});
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
