import type { CompanyProfile } from "@proveedor-publico/shared";
import { MercadoPublicoService } from "../services/mercadoPublico.service.js";
import { scoreTenderForCompany } from "../services/opportunityMatcher.service.js";

export async function runDailyRadar(input: { company: CompanyProfile; date: string; maxResults?: number }) {
  const service = new MercadoPublicoService();
  const tenders = await service.listTendersByDate(input.date);
  return tenders
    .map((tender) => scoreTenderForCompany(input.company, tender))
    .filter((opportunity) => opportunity.recommendation !== "descartar")
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, input.maxResults ?? 10);
}
