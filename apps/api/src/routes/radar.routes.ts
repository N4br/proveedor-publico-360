import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CompanyProfile } from "@proveedor-publico/shared";
import { getUserContext } from "../plugins/auth.js";
import { runDailyRadar } from "../jobs/radar.job.js";

const radarSchema = z.object({
  company: z.unknown(),
  date: z.string(),
  maxResults: z.number().optional()
});

export async function radarRoutes(app: FastifyInstance) {
  app.post("/radar/opportunities", async (request) => {
    await getUserContext(request);
    const payload = radarSchema.parse(request.body);
    const data = await runDailyRadar({
      company: payload.company as CompanyProfile,
      date: payload.date,
      maxResults: payload.maxResults
    });
    return { data };
  });
}
