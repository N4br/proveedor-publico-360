import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { calculateProviderScore } from "@proveedor-publico/shared";
import type { CompanyDocument, CompanyProfile } from "@proveedor-publico/shared";
import { getUserContext } from "../plugins/auth.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../plugins/supabase.js";

const scoreRequestSchema = z.object({
  companyId: z.string().optional(),
  company: z.unknown(),
  documents: z.array(z.unknown()).default([]),
  persist: z.boolean().default(false)
});

export async function scoreRoutes(app: FastifyInstance) {
  app.post("/provider-score/calculate", async (request) => {
    await getUserContext(request);
    const payload = scoreRequestSchema.parse(request.body);
    const score = calculateProviderScore(payload.company as CompanyProfile, payload.documents as CompanyDocument[]);

    if (payload.persist && payload.companyId && isSupabaseConfigured()) {
      await getSupabaseAdmin().from("provider_scores").insert({
        company_id: payload.companyId,
        total_score: score.total,
        category: score.category,
        traffic_light: score.trafficLight,
        criteria: score.criteria,
        gaps: score.gaps,
        recommendations: score.recommendations,
        actions: score.suggestedActions
      });
    }

    return { data: score };
  });
}
