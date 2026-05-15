import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent?: "gold" | "teal" | "wine" | "navy";
};

const accents = {
  gold: "text-lexum-gold bg-amber-50",
  teal: "text-lexum-teal bg-teal-50",
  wine: "text-lexum-wine bg-rose-50",
  navy: "text-lexum-navy bg-lexum-mist"
};

export function MetricCard({ label, value, detail, icon: Icon, accent = "navy" }: Props) {
  return (
    <article className="rounded-md border border-lexum-line bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-lexum-navy">{value}</p>
        </div>
        <div className={`rounded-md p-2 ${accents[accent]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </article>
  );
}
