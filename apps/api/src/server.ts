import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify, { type FastifyError } from "fastify";
import { env } from "./env.js";
import { analysisRoutes } from "./routes/analysis.routes.js";
import { companyRoutes } from "./routes/company.routes.js";
import { documentsRoutes } from "./routes/documents.routes.js";
import { reportsRoutes } from "./routes/reports.routes.js";
import { radarRoutes } from "./routes/radar.routes.js";
import { scoreRoutes } from "./routes/score.routes.js";
import { tenderRoomsRoutes } from "./routes/tenderRooms.routes.js";
import { tendersRoutes } from "./routes/tenders.routes.js";

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "development" ? "debug" : "info",
      redact: [
        "req.headers.authorization",
        "MERCADO_PUBLICO_TICKET",
        "OPENAI_API_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "*.ticket",
        "*.apiKey",
        "*.token"
      ]
    }
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true
  });

  await app.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024,
      files: 8
    }
  });

  app.get("/health", async () => ({
    ok: true,
    service: "proveedor-publico-360-api",
    version: "0.1.0"
  }));

  await app.register(companyRoutes, { prefix: "/api" });
  await app.register(documentsRoutes, { prefix: "/api" });
  await app.register(scoreRoutes, { prefix: "/api" });
  await app.register(tendersRoutes, { prefix: "/api" });
  await app.register(tenderRoomsRoutes, { prefix: "/api" });
  await app.register(analysisRoutes, { prefix: "/api" });
  await app.register(reportsRoutes, { prefix: "/api" });
  await app.register(radarRoutes, { prefix: "/api" });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ err: error }, "request failed");
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    const message = statusCode >= 500 ? "Error interno del servidor" : error.message;
    reply.status(statusCode).send({ error: message });
  });

  return app;
}
