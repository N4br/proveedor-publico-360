import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ProviderScoreResult, TenderAnalysisResult, TenderSummary } from "@proveedor-publico/shared";
import { getUserContext } from "../plugins/auth.js";
import { generateProviderScorePdf, generateTenderRoomPdf } from "../services/pdf.service.js";

const scoreReportSchema = z.object({
  companyName: z.string(),
  rut: z.string(),
  score: z.unknown()
});

const tenderRoomReportSchema = z.object({
  tender: z.unknown(),
  analysis: z.unknown()
});

export async function reportsRoutes(app: FastifyInstance) {
  app.post("/reports/provider-score", async (request, reply) => {
    await getUserContext(request);
    const payload = scoreReportSchema.parse(request.body);
    const pdf = await generateProviderScorePdf({
      companyName: payload.companyName,
      rut: payload.rut,
      score: payload.score as ProviderScoreResult
    });

    reply.header("content-type", "application/pdf");
    reply.header("content-disposition", "attachment; filename=diagnostico-proveedor-publico-360.pdf");
    return reply.send(pdf);
  });

  app.post("/reports/tender-room", async (request, reply) => {
    await getUserContext(request);
    const payload = tenderRoomReportSchema.parse(request.body);
    const pdf = await generateTenderRoomPdf({
      tender: payload.tender as TenderSummary,
      analysis: payload.analysis as TenderAnalysisResult
    });

    reply.header("content-type", "application/pdf");
    reply.header("content-disposition", "attachment; filename=sala-oferta-proveedor-publico-360.pdf");
    return reply.send(pdf);
  });
}
