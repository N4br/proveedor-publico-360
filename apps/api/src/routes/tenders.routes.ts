import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUserContext } from "../plugins/auth.js";
import { MercadoPublicoAttachmentExtractor } from "../services/attachmentExtractor.service.js";
import { MercadoPublicoService } from "../services/mercadoPublico.service.js";
import { upsertTender } from "../services/tenderPersistence.service.js";
import { toApiError } from "../utils/http.js";

const querySchema = z.object({
  date: z.string().optional(),
  state: z.string().optional(),
  buyerCode: z.string().optional(),
  providerRut: z.string().optional()
});

export async function tendersRoutes(app: FastifyInstance) {
  const mercadoPublico = new MercadoPublicoService();
  const extractor = new MercadoPublicoAttachmentExtractor();

  app.get("/tenders/:code", async (request) => {
    await getUserContext(request);
    const code = (request.params as { code: string }).code;
    const tender = await mercadoPublico.getTenderByCode(code);
    if (!tender) throw toApiError("Licitacion no encontrada", 404);
    await upsertTender(tender);
    return { data: tender };
  });

  app.get("/tenders", async (request) => {
    await getUserContext(request);
    const query = querySchema.parse(request.query);
    let data;
    if (query.buyerCode) data = await mercadoPublico.listTendersByBuyer(query.buyerCode, query.date);
    else if (query.providerRut) data = await mercadoPublico.listTendersByProvider(query.providerRut, query.date);
    else if (query.state) data = await mercadoPublico.listTendersByState(query.state, query.date);
    else if (query.date) data = await mercadoPublico.listTendersByDate(query.date);
    else throw toApiError("Debe enviar date, state, buyerCode o providerRut");

    return { data };
  });

  app.post("/tenders/:code/extract-attachments", async (request) => {
    await getUserContext(request);
    const code = (request.params as { code: string }).code;
    const result = await extractor.extract(code);
    return { data: result };
  });
}
