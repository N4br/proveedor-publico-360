import { buildServer } from "./server.js";
import { env } from "./env.js";

const server = await buildServer();

try {
  await server.listen({ port: env.PORT, host: "0.0.0.0" });
  server.log.info({ port: env.PORT }, "Proveedor Publico 360 API listening");
} catch (error) {
  server.log.error(error, "API failed to start");
  process.exit(1);
}
