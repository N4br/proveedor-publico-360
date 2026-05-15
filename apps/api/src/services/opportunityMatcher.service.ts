import type { CompanyProfile, TenderOpportunity, TenderSummary } from "@proveedor-publico/shared";

export function scoreTenderForCompany(company: CompanyProfile, tender: TenderSummary): TenderOpportunity {
  const reasons: string[] = [];
  const haystack = [
    tender.nombre,
    tender.descripcion,
    tender.organismoComprador,
    tender.region,
    ...(tender.productosServicios ?? [])
  ]
    .join(" ")
    .toLowerCase();

  const keywords = [company.rubro, company.productosServicios]
    .filter(Boolean)
    .flatMap((value) => String(value).toLowerCase().split(/[,\n;]/))
    .map((value) => value.trim())
    .filter((value) => value.length >= 4);

  const keywordHits = keywords.filter((keyword) => haystack.includes(keyword)).length;
  if (keywordHits) reasons.push(`Coinciden ${keywordHits} palabra(s) clave de rubro/servicio.`);

  const regionHit = Boolean(tender.region && company.regiones.some((region) => tender.region?.toLowerCase().includes(region.toLowerCase().replace("region de ", "").replace("region del ", ""))));
  if (regionHit) reasons.push("Region compatible con operacion declarada.");

  const amountOk = !tender.montoEstimado || !company.montoAproximado || tender.montoEstimado <= company.montoAproximado;
  if (amountOk && tender.montoEstimado) reasons.push("Monto estimado dentro de capacidad declarada.");

  const compatibilityScore = Math.min(100, keywordHits * 25 + (regionHit ? 25 : 0) + (amountOk ? 20 : 0));
  const preliminaryRisk = !amountOk ? "alto" : compatibilityScore >= 70 ? "bajo" : compatibilityScore >= 40 ? "medio" : "no_identificado";
  const recommendation =
    compatibilityScore >= 75 ? "activar_sala_oferta" : compatibilityScore >= 50 ? "preparar" : compatibilityScore >= 25 ? "mirar" : "descartar";

  return {
    tender,
    compatibilityScore,
    preliminaryRisk,
    recommendation,
    reasons: reasons.length ? reasons : ["No hay compatibilidad suficiente con los datos disponibles."]
  };
}
