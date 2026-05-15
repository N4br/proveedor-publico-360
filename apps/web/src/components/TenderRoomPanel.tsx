import { useState } from "react";
import { AlertTriangle, ClipboardList, FileSearch, Play, Search } from "lucide-react";
import type { AttachmentExtractionResult, TenderAnalysisResult, TenderSummary } from "@proveedor-publico/shared";

type Props = {
  tender: TenderSummary | null;
  extraction: AttachmentExtractionResult | null;
  analysis: TenderAnalysisResult | null;
  busy: string | null;
  onFetchTender: (code: string) => void;
  onCreateRoom: (code: string) => void;
  onAnalyze: () => void;
};

export function TenderRoomPanel({ tender, extraction, analysis, busy, onFetchTender, onCreateRoom, onAnalyze }: Props) {
  const [code, setCode] = useState(tender?.codigoExterno ?? "1978-33-L126");

  return (
    <section className="grid gap-6">
      <div className="rounded-md border border-lexum-line bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="tender-code">
              ID licitacion
            </label>
            <input id="tender-code" value={code} onChange={(event) => setCode(event.target.value)} className="focus-ring max-w-xl rounded-md border border-lexum-line px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onFetchTender(code)} disabled={busy === "tender"} className="focus-ring inline-flex items-center gap-2 rounded-md border border-lexum-line px-4 py-2 text-sm font-medium text-lexum-navy hover:bg-lexum-mist disabled:opacity-60">
              <Search size={17} />
              Buscar licitacion
            </button>
            <button onClick={() => onCreateRoom(code)} disabled={busy === "room"} className="focus-ring inline-flex items-center gap-2 rounded-md bg-lexum-navy px-4 py-2 text-sm font-medium text-white hover:bg-lexum-ink disabled:opacity-60">
              <Play size={17} />
              Activar Sala de Oferta
            </button>
          </div>
        </div>
      </div>

      {tender ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-md border border-lexum-line bg-white p-5 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-lexum-gold">{tender.codigoExterno}</p>
                <h2 className="mt-1 text-xl font-semibold text-lexum-navy">{tender.nombre}</h2>
              </div>
              <FileSearch className="text-lexum-navy" size={24} />
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <Row label="Comprador" value={tender.organismoComprador ?? "no identificado"} />
              <Row label="Estado" value={tender.estado ?? "no identificado"} />
              <Row label="Cierre" value={tender.fechaCierre ?? "no identificado"} />
              <Row label="Region" value={tender.region ?? "no identificado"} />
              <Row label="Monto estimado" value={tender.montoEstimado ? `${tender.moneda ?? "CLP"} ${tender.montoEstimado.toLocaleString("es-CL")}` : "no identificado"} />
            </dl>
          </article>

          <article className="rounded-md border border-lexum-line bg-white p-5 shadow-panel">
            <h3 className="text-lg font-semibold text-lexum-navy">Extraccion de adjuntos</h3>
            {extraction ? (
              <div className="mt-4 grid gap-3">
                <div className="flex items-center gap-2 rounded-md border border-lexum-line bg-lexum-mist px-3 py-2 text-sm font-medium text-lexum-navy">
                  <AlertTriangle size={17} />
                  {extraction.status.replaceAll("_", " ")}
                </div>
                <div className="grid gap-2 text-sm text-slate-600">
                  {extraction.notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
                {extraction.attachments.length ? (
                  <ul className="grid gap-2 text-sm">
                    {extraction.attachments.map((attachment) => (
                      <li key={`${attachment.fileName}-${attachment.sourceUrl}`} className="rounded-md border border-lexum-line px-3 py-2">
                        {attachment.fileName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-md border border-dashed border-lexum-gold bg-amber-50 px-3 py-3 text-sm text-lexum-ink">
                    Requiere carga manual de bases/anexos para analisis documental.
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">Activa una Sala de Oferta para intentar recuperacion automatica de adjuntos.</p>
            )}
          </article>
        </div>
      ) : null}

      {tender ? (
        <article className="rounded-md border border-lexum-line bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-lexum-navy">Analisis preliminar</h3>
              <p className="text-sm text-slate-600">Salida estructurada para revision humana.</p>
            </div>
            <button onClick={onAnalyze} disabled={busy === "analysis"} className="focus-ring inline-flex items-center gap-2 rounded-md bg-lexum-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              <ClipboardList size={17} />
              Generar matriz
            </button>
          </div>

          {analysis ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Panel title="Resumen ejecutivo" items={[analysis.executiveSummary]} />
              <Panel title="Requisitos" items={analysis.requirements.map((item) => `${item.id}: ${item.requirement} · ${item.status}`)} />
              <Panel title="Riesgos" items={analysis.risks.map((risk) => `${risk.level}: ${risk.title}`)} />
              <Panel title="Checklist" items={analysis.checklist.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.item}`)} />
            </div>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-lexum-line pb-2">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="text-lexum-ink">{value}</dd>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-lexum-line p-4">
      <h4 className="font-semibold text-lexum-navy">{title}</h4>
      <ul className="mt-3 grid gap-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
