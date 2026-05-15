import { ArrowRight, ClipboardCheck, FileText, FolderCheck, SearchCheck } from "lucide-react";
import type { CompanyDocument, CompanyProfile, ProviderScoreResult, TenderSummary } from "@proveedor-publico/shared";
import type { ActiveView } from "../App";
import { MetricCard } from "./MetricCard";

type Props = {
  company: CompanyProfile;
  score: ProviderScoreResult;
  documents: CompanyDocument[];
  tender: TenderSummary | null;
  onNavigate: (view: ActiveView) => void;
  onDownloadScorePdf: () => void;
  busy: string | null;
};

export function PortalHome({ company, score, documents, tender, onNavigate, onDownloadScorePdf, busy }: Props) {
  return (
    <section className="grid gap-6">
      <div className="grid gap-4 rounded-md border border-lexum-line bg-white p-5 shadow-panel lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lexum-gold">Portal juridico-comercial</p>
          <h2 className="mt-2 text-2xl font-semibold text-lexum-navy">Preparacion, documentos y Sala de Oferta para Mercado Publico</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Datos publicos de licitaciones, intento controlado de recuperacion de adjuntos disponibles y analisis de documentos cargados por el cliente.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <button onClick={() => onNavigate("empresa")} className="focus-ring inline-flex items-center gap-2 rounded-md bg-lexum-navy px-4 py-2 text-sm font-medium text-white hover:bg-lexum-ink">
            <ClipboardCheck size={17} />
            Iniciar diagnostico
          </button>
          <button onClick={() => onNavigate("sala")} className="focus-ring inline-flex items-center gap-2 rounded-md border border-lexum-gold px-4 py-2 text-sm font-medium text-lexum-navy hover:bg-amber-50">
            <SearchCheck size={17} />
            Buscar licitacion
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Score" value={`${score.total}/100`} detail={`${score.category} · semaforo ${score.trafficLight}`} icon={ClipboardCheck} accent="gold" />
        <MetricCard label="Documentos" value={`${documents.length}`} detail="registros en Carpeta Viva" icon={FolderCheck} accent="teal" />
        <MetricCard label="Empresa" value={company.nombreFantasia || company.razonSocial} detail={company.rubro || "rubro no definido"} icon={FileText} />
        <MetricCard label="Sala activa" value={tender?.codigoExterno ?? "sin sala"} detail={tender?.estado ?? "lista para activar"} icon={SearchCheck} accent="wine" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-md border border-lexum-line bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold text-lexum-navy">Brechas prioritarias</h3>
          <div className="mt-4 grid gap-3">
            {score.gaps.slice(0, 5).map((gap) => (
              <div key={gap} className="rounded-md border border-lexum-line bg-lexum-mist px-3 py-2 text-sm text-slate-700">
                {gap}
              </div>
            ))}
          </div>
          <button onClick={onDownloadScorePdf} disabled={busy === "pdf"} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-lexum-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            <FileText size={17} />
            Descargar informe
          </button>
        </article>

        <article className="rounded-md border border-lexum-line bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold text-lexum-navy">Acciones sugeridas</h3>
          <div className="mt-4 grid gap-3">
            {score.suggestedActions.map((action) => (
              <button key={action} onClick={() => onNavigate(action.includes("documental") ? "carpeta" : "empresa")} className="focus-ring flex items-center justify-between rounded-md border border-lexum-line px-3 py-3 text-left text-sm text-slate-700 hover:border-lexum-gold hover:bg-amber-50">
                <span>{action}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
