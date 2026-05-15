import { Download, Gauge } from "lucide-react";
import type { ProviderScoreResult } from "@proveedor-publico/shared";

type Props = {
  score: ProviderScoreResult;
  onDownloadPdf: () => void;
  busy: boolean;
};

const colors = {
  rojo: "bg-rose-600",
  amarillo: "bg-amber-500",
  verde: "bg-emerald-600",
  azul: "bg-sky-700"
};

export function ProviderScorePanel({ score, onDownloadPdf, busy }: Props) {
  return (
    <section className="rounded-md border border-lexum-line bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-lexum-navy">Score Proveedor Publico</h2>
          <p className="text-sm text-slate-600">Categoria {score.category}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-md text-white ${colors[score.trafficLight]}`}>
          <Gauge size={22} />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-end gap-2">
          <span className="text-5xl font-semibold text-lexum-navy">{score.total}</span>
          <span className="pb-2 text-sm text-slate-500">/100</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-lexum-mist">
          <div className="h-full bg-lexum-gold" style={{ width: `${score.total}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {score.criteria.map((item) => (
          <div key={item.key} className="rounded-md border border-lexum-line p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-lexum-ink">{item.label}</span>
              <span className="font-semibold text-lexum-navy">
                {item.points}/{item.maxPoints}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-lexum-mist">
              <div className="h-full rounded-full bg-lexum-teal" style={{ width: `${(item.points / item.maxPoints) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={onDownloadPdf} disabled={busy} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-lexum-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        <Download size={17} />
        Descargar informe
      </button>
    </section>
  );
}
