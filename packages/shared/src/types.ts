export type UserRole = "admin" | "cliente" | "revisor_lexum";

export type CompanyProfile = {
  id?: string;
  razonSocial: string;
  rut: string;
  nombreFantasia?: string;
  rubro?: string;
  productosServicios?: string;
  regiones: string[];
  capacidadOperativa?: string;
  experienciaPrevia?: string;
  inscritaRegistroProveedores: boolean;
  haVendidoEstado: boolean;
  montoAproximado?: number;
  contactoPrincipal?: string;
  correo?: string;
  telefono?: string;
  observaciones?: string;
};

export type DocumentStatus =
  | "cargado"
  | "faltante"
  | "vencido"
  | "incompleto"
  | "requiere_revision"
  | "validado";

export type DocumentTypeKey =
  | "constitucion_escritura"
  | "certificado_vigencia"
  | "poderes"
  | "rut_empresa"
  | "antecedentes_tributarios"
  | "certificados_laborales_previsionales"
  | "experiencia"
  | "ordenes_compra"
  | "contratos_ejecutados"
  | "fichas_tecnicas"
  | "cv_equipo"
  | "catalogos"
  | "declaraciones_juradas"
  | "otros";

export type CompanyDocument = {
  id?: string;
  companyId?: string;
  documentTypeId: DocumentTypeKey;
  fileName: string;
  status: DocumentStatus;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt?: string;
  expirationDate?: string;
  observations?: string;
  metadata?: Record<string, unknown>;
};

export type ProviderScoreCategory = "bajo" | "medio" | "alto" | "avanzado";
export type TrafficLight = "rojo" | "amarillo" | "verde" | "azul";

export type ProviderScoreCriterion = {
  key: string;
  label: string;
  maxPoints: number;
  points: number;
  evidence: string[];
  gaps: string[];
};

export type ProviderScoreResult = {
  total: number;
  category: ProviderScoreCategory;
  trafficLight: TrafficLight;
  criteria: ProviderScoreCriterion[];
  gaps: string[];
  recommendations: string[];
  suggestedActions: string[];
};

export type TenderSummary = {
  codigoExterno: string;
  nombre: string;
  descripcion?: string;
  estado?: string;
  codigoEstado?: number;
  organismoComprador?: string;
  codigoOrganismo?: string;
  region?: string;
  fechaCierre?: string | null;
  montoEstimado?: number | null;
  moneda?: string;
  productosServicios?: string[];
  raw?: unknown;
};

export type TenderRecommendation =
  | "mirar"
  | "descartar"
  | "preparar"
  | "activar_sala_oferta";

export type TenderOpportunity = {
  tender: TenderSummary;
  compatibilityScore: number;
  preliminaryRisk: "bajo" | "medio" | "alto" | "no_identificado";
  recommendation: TenderRecommendation;
  reasons: string[];
};

export type AttachmentExtractionStatus =
  | "ok"
  | "adjuntos_no_disponibles_automaticamente"
  | "requiere_carga_manual"
  | "error_portal"
  | "captcha_o_sesion_requerida";

export type TenderAttachmentMetadata = {
  fileName: string;
  sourceUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  downloadedAt?: string;
  tenderCode: string;
  storageBucket?: string;
  storagePath?: string;
  metadata?: Record<string, unknown>;
};

export type AttachmentExtractionResult = {
  tenderCode: string;
  status: AttachmentExtractionStatus;
  method: "html_discovery" | "playwright" | "manual";
  detailsUrl?: string;
  attachmentGatewayUrl?: string;
  portalStatusCode?: number;
  attachments: TenderAttachmentMetadata[];
  notes: string[];
};

export type RequirementItem = {
  id: string;
  requirement: string;
  source: {
    document?: string;
    page?: string | number;
    clause?: string;
    section?: string;
  };
  mandatory: boolean;
  status: "cumple" | "no_cumple" | "no_identificado" | "requiere_revision";
  evidence?: string;
  recommendation?: string;
};

export type TenderAnalysisResult = {
  executiveSummary: string;
  requirements: RequirementItem[];
  requiredDocuments: RequirementItem[];
  criticalDates: Array<{ label: string; date: string; source?: string }>;
  evaluationCriteria: RequirementItem[];
  guaranteesAndPenalties: RequirementItem[];
  risks: Array<{
    title: string;
    level: "bajo" | "medio" | "alto" | "no_identificado";
    source?: string;
    mitigation?: string;
  }>;
  suggestedQuestions: string[];
  checklist: Array<{ item: string; done: boolean; source?: string }>;
  preliminaryRecommendation:
    | "postular"
    | "no_postular"
    | "postular_con_observaciones"
    | "requiere_revision_humana";
  disclaimer: string;
};

export type PlanCode =
  | "diagnostico"
  | "proveedor_preparado"
  | "proveedor_360"
  | "sala_oferta_express"
  | "sala_oferta_completa"
  | "sala_oferta_estrategica";
