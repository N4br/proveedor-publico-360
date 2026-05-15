import type { PlanCode } from "./types";

export type CommercialPlan = {
  code: PlanCode;
  name: string;
  billingType: "one_time" | "monthly" | "service";
  launchPriceCLP: number;
  regularPriceCLP: number;
  includes: string[];
  limits: {
    documentVault: boolean;
    monthlyOpportunities: number;
    monthlyTenderAnalysis: number;
    tenderRoomScope?: "express" | "completa" | "estrategica";
  };
};

export const COMMERCIAL_PLANS: CommercialPlan[] = [
  {
    code: "diagnostico",
    name: "Diagnostico Proveedor Publico",
    billingType: "one_time",
    launchPriceCLP: 29990,
    regularPriceCLP: 49990,
    includes: ["Score", "brechas", "documentos faltantes", "recomendacion inicial"],
    limits: { documentVault: false, monthlyOpportunities: 0, monthlyTenderAnalysis: 0 }
  },
  {
    code: "proveedor_preparado",
    name: "Proveedor Preparado",
    billingType: "monthly",
    launchPriceCLP: 69990,
    regularPriceCLP: 89990,
    includes: ["Carpeta documental", "hasta 5 oportunidades filtradas al mes", "reporte mensual"],
    limits: { documentVault: true, monthlyOpportunities: 5, monthlyTenderAnalysis: 0 }
  },
  {
    code: "proveedor_360",
    name: "Proveedor 360",
    billingType: "monthly",
    launchPriceCLP: 189990,
    regularPriceCLP: 249990,
    includes: ["Carpeta", "hasta 10 oportunidades filtradas", "1 analisis mensual", "matriz simple", "checklist", "revision de puntos criticos"],
    limits: { documentVault: true, monthlyOpportunities: 10, monthlyTenderAnalysis: 1 }
  },
  {
    code: "sala_oferta_express",
    name: "Sala de Oferta Express",
    billingType: "service",
    launchPriceCLP: 99990,
    regularPriceCLP: 99990,
    includes: ["Revision rapida", "checklist base", "alertas principales"],
    limits: { documentVault: true, monthlyOpportunities: 0, monthlyTenderAnalysis: 1, tenderRoomScope: "express" }
  },
  {
    code: "sala_oferta_completa",
    name: "Sala de Oferta Completa",
    billingType: "service",
    launchPriceCLP: 179990,
    regularPriceCLP: 179990,
    includes: ["Matriz de requisitos", "riesgos", "documentos exigidos", "preguntas sugeridas"],
    limits: { documentVault: true, monthlyOpportunities: 0, monthlyTenderAnalysis: 1, tenderRoomScope: "completa" }
  },
  {
    code: "sala_oferta_estrategica",
    name: "Sala de Oferta Estrategica",
    billingType: "service",
    launchPriceCLP: 299990,
    regularPriceCLP: 299990,
    includes: ["Analisis juridico-comercial avanzado", "estrategia de postulacion", "revision humana LEXUM"],
    limits: { documentVault: true, monthlyOpportunities: 0, monthlyTenderAnalysis: 1, tenderRoomScope: "estrategica" }
  }
];

export function getPlan(code: PlanCode) {
  return COMMERCIAL_PLANS.find((plan) => plan.code === code);
}
