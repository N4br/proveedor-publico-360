import OpenAI from "openai";
import type { CompanyDocument, CompanyProfile, TenderAnalysisResult, TenderSummary } from "@proveedor-publico/shared";
import { calculateProviderScore } from "@proveedor-publico/shared";
import { env } from "../env.js";

const DISCLAIMER =
  "Proveedor Publico 360 no garantiza adjudicaciones ni reemplaza la responsabilidad del proveedor de revisar, completar y subir sus ofertas en Mercado Publico. El servicio entrega apoyo juridico-comercial, analisis documental, identificacion de riesgos y recomendaciones preliminares conforme a la informacion disponible y documentos proporcionados por el cliente.";

export class AIService {
  private client: OpenAI | null = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

  async classifyDocument(fileText: string, metadata: Record<string, unknown>) {
    return this.runJsonTask("classifyDocument", { fileText, metadata }, mockDocumentClassification(metadata));
  }

  async extractTenderRequirements(text: string) {
    return this.runJsonTask("extractTenderRequirements", { text }, mockRequirements());
  }

  async generateEligibilityMatrix(tenderData: TenderSummary, documents: CompanyDocument[]) {
    return this.runJsonTask("generateEligibilityMatrix", { tenderData, documents }, mockRequirements());
  }

  async generateQuestionsForForum(requirements: unknown, risks: unknown) {
    return this.runJsonTask("generateQuestionsForForum", { requirements, risks }, [
      "Confirmar si se aceptan documentos equivalentes cuando la base no identifica formato.",
      "Solicitar aclaracion de plazo y lugar de entrega si no aparece expresamente.",
      "Preguntar por criterios de evaluacion no ponderados o ambiguos."
    ]);
  }

  async generateTenderSummary(tenderData: TenderSummary, documents: CompanyDocument[] = []): Promise<TenderAnalysisResult> {
    const fallback = mockTenderAnalysis(tenderData, documents);
    return this.runJsonTask("generateTenderSummary", { tenderData, documents }, fallback);
  }

  async generateProviderScoreRecommendations(companyProfile: CompanyProfile, documents: CompanyDocument[]) {
    return calculateProviderScore(companyProfile, documents);
  }

  async generatePDFReport(data: unknown) {
    return this.runJsonTask("generatePDFReport", { data }, { status: "prepared", disclaimer: DISCLAIMER });
  }

  private async runJsonTask<T>(task: string, payload: unknown, fallback: T): Promise<T> {
    if (env.AI_MODE !== "openai" || !this.client) return fallback;

    const response = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un analista juridico-comercial para licitaciones chilenas. No inventes requisitos. Si un dato no aparece, responde 'no identificado'. Separa hechos de recomendaciones. Toda recomendacion juridica debe ser preliminar salvo revision LEXUM. Devuelve JSON valido."
        },
        {
          role: "user",
          content: JSON.stringify({ task, payload })
        }
      ]
    });

    const content = response.choices[0]?.message.content;
    if (!content) return fallback;
    return JSON.parse(content) as T;
  }
}

function mockDocumentClassification(metadata: Record<string, unknown>) {
  return {
    documentType: "otros",
    confidence: 0.4,
    facts: [{ label: "nombre_archivo", value: metadata.fileName ?? "no identificado" }],
    warnings: ["Clasificacion mock. Requiere IA real o revision humana."]
  };
}

function mockRequirements() {
  return {
    requirements: [
      {
        id: "REQ-001",
        requirement: "no identificado",
        mandatory: true,
        status: "requiere_revision",
        source: { document: "no identificado" },
        recommendation: "Cargar bases/anexos para extraer requisitos especificos."
      }
    ]
  };
}

function mockTenderAnalysis(tender: TenderSummary, documents: CompanyDocument[]): TenderAnalysisResult {
  const hasDocuments = documents.length > 0;
  return {
    executiveSummary: hasDocuments
      ? `Analisis preliminar generado para ${tender.codigoExterno}. Requiere validacion humana LEXUM antes de postular.`
      : `Ficha publica consultada para ${tender.codigoExterno}. No hay bases/anexos analizables cargados, por lo que los requisitos especificos quedan no identificados.`,
    requirements: [
      {
        id: "REQ-001",
        requirement: hasDocuments ? "Revisar requisitos extraidos desde documentos cargados." : "no identificado",
        source: { document: hasDocuments ? "documentos cargados por cliente" : "no identificado" },
        mandatory: true,
        status: "requiere_revision",
        recommendation: "Validar contra bases administrativas y tecnicas."
      }
    ],
    requiredDocuments: [
      {
        id: "DOC-001",
        requirement: "Documentos exigidos por bases",
        source: { document: "no identificado" },
        mandatory: true,
        status: "no_identificado",
        recommendation: "Cargar bases/anexos o descargar manualmente desde Mercado Publico."
      }
    ],
    criticalDates: tender.fechaCierre ? [{ label: "Cierre de oferta", date: tender.fechaCierre, source: "API Mercado Publico" }] : [],
    evaluationCriteria: [
      {
        id: "EVAL-001",
        requirement: "Criterios de evaluacion",
        source: { document: "no identificado" },
        mandatory: true,
        status: "no_identificado"
      }
    ],
    guaranteesAndPenalties: [
      {
        id: "GAR-001",
        requirement: "Garantias, multas o sanciones",
        source: { document: "no identificado" },
        mandatory: false,
        status: "no_identificado"
      }
    ],
    risks: [
      {
        title: "Riesgo documental",
        level: hasDocuments ? "medio" : "alto",
        source: hasDocuments ? "documentos cargados por cliente" : "ausencia de bases/anexos",
        mitigation: "Completar carga documental y solicitar revision humana antes de postular."
      }
    ],
    suggestedQuestions: [
      "Solicitar aclaracion de documentos exigidos si las bases no son concluyentes.",
      "Confirmar plazos y lugar de ejecucion si no aparecen con precision."
    ],
    checklist: [
      { item: "Verificar fecha de cierre en Mercado Publico", done: Boolean(tender.fechaCierre), source: "API Mercado Publico" },
      { item: "Cargar bases administrativas y tecnicas", done: hasDocuments },
      { item: "Validar poderes y documentos societarios vigentes", done: false }
    ],
    preliminaryRecommendation: hasDocuments ? "postular_con_observaciones" : "requiere_revision_humana",
    disclaimer: DISCLAIMER
  };
}
