import type {
  CompanyDocument,
  CompanyProfile,
  DocumentStatus,
  DocumentTypeKey,
  ProviderScoreCategory,
  ProviderScoreCriterion,
  ProviderScoreResult,
  TrafficLight
} from "./types.js";

export type ScoreConfig = {
  identity: number;
  providerRegistration: number;
  corporateDocuments: number;
  experience: number;
  operationalCapacity: number;
  taxLaborDocuments: number;
  compatibility: number;
  liveFolder: number;
};

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  identity: 10,
  providerRegistration: 10,
  corporateDocuments: 15,
  experience: 20,
  operationalCapacity: 15,
  taxLaborDocuments: 10,
  compatibility: 10,
  liveFolder: 10
};

const VALID_STATUSES = new Set<DocumentStatus>(["cargado", "validado"]);

const hasText = (value?: string | null) => Boolean(value && value.trim().length > 2);

function hasAnyValidDocument(documents: CompanyDocument[], types: DocumentTypeKey[]) {
  return documents.some((doc) => types.includes(doc.documentTypeId) && VALID_STATUSES.has(doc.status));
}

function countValidDocuments(documents: CompanyDocument[], types: DocumentTypeKey[]) {
  return documents.filter((doc) => types.includes(doc.documentTypeId) && VALID_STATUSES.has(doc.status)).length;
}

function criterion(
  key: string,
  label: string,
  maxPoints: number,
  points: number,
  evidence: string[],
  gaps: string[]
): ProviderScoreCriterion {
  return {
    key,
    label,
    maxPoints,
    points: Math.max(0, Math.min(maxPoints, Math.round(points))),
    evidence,
    gaps
  };
}

export function calculateProviderScore(
  company: CompanyProfile,
  documents: CompanyDocument[] = [],
  config: ScoreConfig = DEFAULT_SCORE_CONFIG
): ProviderScoreResult {
  const criteria: ProviderScoreCriterion[] = [];

  const identityChecks = [
    hasText(company.razonSocial),
    hasText(company.rut),
    hasText(company.contactoPrincipal),
    hasText(company.correo),
    hasText(company.telefono)
  ];
  const identityPoints = (identityChecks.filter(Boolean).length / identityChecks.length) * config.identity;
  criteria.push(
    criterion(
      "identity",
      "Identidad y datos empresa",
      config.identity,
      identityPoints,
      identityChecks.filter(Boolean).length >= 4 ? ["Datos principales completos"] : [],
      identityChecks.every(Boolean) ? [] : ["Completar razon social, RUT, contacto, correo y telefono"]
    )
  );

  criteria.push(
    criterion(
      "provider_registration",
      "Inscripcion / estado proveedor",
      config.providerRegistration,
      company.inscritaRegistroProveedores ? config.providerRegistration : 0,
      company.inscritaRegistroProveedores ? ["Declara inscripcion en Registro de Proveedores"] : [],
      company.inscritaRegistroProveedores ? [] : ["Verificar o regularizar inscripcion en Registro de Proveedores"]
    )
  );

  const corporateTypes: DocumentTypeKey[] = ["constitucion_escritura", "certificado_vigencia", "poderes", "rut_empresa"];
  const corporateCount = countValidDocuments(documents, corporateTypes);
  criteria.push(
    criterion(
      "corporate_documents",
      "Documentos societarios / poderes",
      config.corporateDocuments,
      (corporateCount / corporateTypes.length) * config.corporateDocuments,
      corporateCount ? [`${corporateCount} documento(s) societario(s) cargado(s)`] : [],
      corporateCount === corporateTypes.length ? [] : ["Subir escritura, vigencia, poderes y RUT empresa"]
    )
  );

  const experienceTypes: DocumentTypeKey[] = ["experiencia", "ordenes_compra", "contratos_ejecutados"];
  const experienceEvidence =
    company.haVendidoEstado || hasText(company.experienciaPrevia) || hasAnyValidDocument(documents, experienceTypes);
  const experiencePoints =
    (company.haVendidoEstado ? 8 : 0) +
    (hasText(company.experienciaPrevia) ? 5 : 0) +
    Math.min(7, countValidDocuments(documents, experienceTypes) * 3);
  criteria.push(
    criterion(
      "experience",
      "Experiencia acreditable",
      config.experience,
      Math.min(config.experience, experiencePoints),
      experienceEvidence ? ["Hay antecedentes de experiencia declarada o documentada"] : [],
      experienceEvidence ? [] : ["Documentar experiencia, ordenes de compra o contratos ejecutados"]
    )
  );

  const capacityChecks = [hasText(company.capacidadOperativa), hasText(company.productosServicios), Boolean(company.montoAproximado && company.montoAproximado > 0)];
  criteria.push(
    criterion(
      "operational_capacity",
      "Capacidad tecnica / operativa",
      config.operationalCapacity,
      (capacityChecks.filter(Boolean).length / capacityChecks.length) * config.operationalCapacity,
      capacityChecks.filter(Boolean).length >= 2 ? ["Capacidad y oferta comercial declaradas"] : [],
      capacityChecks.every(Boolean) ? [] : ["Precisar capacidad operativa, servicios y monto maximo ejecutable"]
    )
  );

  const taxLaborTypes: DocumentTypeKey[] = ["antecedentes_tributarios", "certificados_laborales_previsionales"];
  const taxLaborCount = countValidDocuments(documents, taxLaborTypes);
  criteria.push(
    criterion(
      "tax_labor_documents",
      "Documentos tributarios / laborales",
      config.taxLaborDocuments,
      (taxLaborCount / taxLaborTypes.length) * config.taxLaborDocuments,
      taxLaborCount ? [`${taxLaborCount} antecedente(s) tributario/laboral cargado(s)`] : [],
      taxLaborCount === taxLaborTypes.length ? [] : ["Subir antecedentes tributarios y certificados laborales/previsionales vigentes"]
    )
  );

  const compatibilityChecks = [hasText(company.rubro), hasText(company.productosServicios), company.regiones.length > 0];
  criteria.push(
    criterion(
      "compatibility",
      "Compatibilidad con rubro y region",
      config.compatibility,
      (compatibilityChecks.filter(Boolean).length / compatibilityChecks.length) * config.compatibility,
      compatibilityChecks.every(Boolean) ? ["Rubro, oferta y regiones definidos"] : [],
      compatibilityChecks.every(Boolean) ? [] : ["Definir rubro, palabras clave y regiones de operacion"]
    )
  );

  const expectedCore: DocumentTypeKey[] = [
    "constitucion_escritura",
    "certificado_vigencia",
    "poderes",
    "rut_empresa",
    "antecedentes_tributarios",
    "certificados_laborales_previsionales",
    "experiencia",
    "fichas_tecnicas"
  ];
  const coreValid = countValidDocuments(documents, expectedCore);
  const expiredOrReview = documents.filter((doc) => ["vencido", "incompleto", "requiere_revision"].includes(doc.status)).length;
  const folderPoints = Math.max(0, (coreValid / expectedCore.length) * config.liveFolder - Math.min(3, expiredOrReview));
  criteria.push(
    criterion(
      "live_folder",
      "Carpeta documental vigente / completa",
      config.liveFolder,
      folderPoints,
      coreValid ? [`${coreValid} documento(s) clave vigentes/cargados`] : [],
      coreValid >= expectedCore.length && expiredOrReview === 0
        ? []
        : ["Completar matriz documental y revisar vencimientos/observaciones"]
    )
  );

  const total = criteria.reduce((sum, item) => sum + item.points, 0);
  const roundedTotal = Math.max(0, Math.min(100, Math.round(total)));
  const category = scoreCategory(roundedTotal);
  const trafficLight = scoreTrafficLight(category);
  const gaps = criteria.flatMap((item) => item.gaps);

  return {
    total: roundedTotal,
    category,
    trafficLight,
    criteria,
    gaps,
    recommendations: buildRecommendations(category, gaps),
    suggestedActions: buildActions(criteria)
  };
}

export function scoreCategory(score: number): ProviderScoreCategory {
  if (score >= 85) return "avanzado";
  if (score >= 70) return "alto";
  if (score >= 40) return "medio";
  return "bajo";
}

export function scoreTrafficLight(category: ProviderScoreCategory): TrafficLight {
  if (category === "avanzado") return "azul";
  if (category === "alto") return "verde";
  if (category === "medio") return "amarillo";
  return "rojo";
}

function buildRecommendations(category: ProviderScoreCategory, gaps: string[]) {
  const base = [
    "Mantener una revision humana LEXUM antes de presentar ofertas relevantes.",
    "Actualizar documentos con vencimiento antes de activar una Sala de Oferta."
  ];

  if (category === "bajo") {
    return ["Priorizar regularizacion documental antes de postular.", ...gaps.slice(0, 4), ...base];
  }

  if (category === "medio") {
    return ["Puede mirar oportunidades simples, pero conviene cerrar brechas criticas.", ...gaps.slice(0, 3), ...base];
  }

  if (category === "alto") {
    return ["Buen punto de partida para oportunidades compatibles de baja o mediana complejidad.", ...base];
  }

  return ["Perfil avanzado: enfocar energia en seleccion estrategica de licitaciones y calidad de oferta.", ...base];
}

function buildActions(criteria: ProviderScoreCriterion[]) {
  return criteria
    .filter((item) => item.points < item.maxPoints)
    .sort((a, b) => b.maxPoints - b.points - (a.maxPoints - a.points))
    .slice(0, 5)
    .map((item) => `Mejorar: ${item.label}`);
}
