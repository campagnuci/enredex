import { buildApp } from "./app.js";

const app = await buildApp();

try {
  await app.listen({ port: app.config.PORT, host: app.config.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    app.log.info({ signal }, "shutting down");
    app
      .close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
}
