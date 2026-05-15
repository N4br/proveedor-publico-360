import type { DocumentTypeKey } from "./types";

export type DocumentTypeDefinition = {
  id: DocumentTypeKey;
  name: string;
  category:
    | "identidad"
    | "societario"
    | "tributario"
    | "laboral"
    | "experiencia"
    | "tecnico"
    | "comercial"
    | "licitacion"
    | "otros";
  requiresExpiration: boolean;
  scoreGroup?: string;
};

export const DOCUMENT_TYPES: DocumentTypeDefinition[] = [
  { id: "constitucion_escritura", name: "Constitucion / escritura", category: "societario", requiresExpiration: false, scoreGroup: "societario" },
  { id: "certificado_vigencia", name: "Certificado de vigencia", category: "societario", requiresExpiration: true, scoreGroup: "societario" },
  { id: "poderes", name: "Poderes", category: "societario", requiresExpiration: true, scoreGroup: "societario" },
  { id: "rut_empresa", name: "RUT empresa", category: "identidad", requiresExpiration: false, scoreGroup: "identidad" },
  { id: "antecedentes_tributarios", name: "Antecedentes tributarios", category: "tributario", requiresExpiration: true, scoreGroup: "tributario_laboral" },
  { id: "certificados_laborales_previsionales", name: "Certificados laborales/previsionales", category: "laboral", requiresExpiration: true, scoreGroup: "tributario_laboral" },
  { id: "experiencia", name: "Experiencia", category: "experiencia", requiresExpiration: false, scoreGroup: "experiencia" },
  { id: "ordenes_compra", name: "Ordenes de compra", category: "experiencia", requiresExpiration: false, scoreGroup: "experiencia" },
  { id: "contratos_ejecutados", name: "Contratos ejecutados", category: "experiencia", requiresExpiration: false, scoreGroup: "experiencia" },
  { id: "fichas_tecnicas", name: "Fichas tecnicas", category: "tecnico", requiresExpiration: false, scoreGroup: "capacidad" },
  { id: "cv_equipo", name: "CV equipo", category: "tecnico", requiresExpiration: false, scoreGroup: "capacidad" },
  { id: "catalogos", name: "Catalogos", category: "comercial", requiresExpiration: false, scoreGroup: "compatibilidad" },
  { id: "declaraciones_juradas", name: "Declaraciones juradas", category: "licitacion", requiresExpiration: true },
  { id: "otros", name: "Otros", category: "otros", requiresExpiration: false }
];

export function getDocumentType(id: DocumentTypeKey) {
  return DOCUMENT_TYPES.find((type) => type.id === id);
}
