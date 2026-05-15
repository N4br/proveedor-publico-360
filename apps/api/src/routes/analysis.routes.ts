import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CompanyDocument, TenderSummary } from "@proveedor-publico/shared";
import { getUserContext } from "../plugins/auth.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../plugins/supabase.js";
import { AIService } from "../services/ai.service.js";

const analysisSchema = z.object({
  tenderRoomId: z.string().optional(),
  tender: z.unknown(),
  documents: z.array(z.unknown()).default([]),
  persist: z.boolean().default(false)
});

export async function analysisRoutes(app: FastifyInstance) {
  const ai = new AIService();

  app.post("/analyze-tender-documents", async (request) => {
    await getUserContext(request);
    const payload = analysisSchema.parse(request.body);
    const analysis = await ai.generateTenderSummary(payload.tender as TenderSummary, payload.documents as CompanyDocument[]);

    if (payload.persist && payload.tenderRoomId && isSupabaseConfigured()) {
      await getSupabaseAdmin().from("tender_analysis").insert({
        tender_room_id: payload.tenderRoomId,
        analysis_type: "sala_oferta",
        status: "draft",
        summary: analysis.executiveSummary,
        result: analysis
      });
    }

    return { data: analysis };
  });
}
