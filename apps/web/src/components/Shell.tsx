import { Building2, FileStack, Gauge, SearchCheck } from "lucide-react";
import type { ActiveView } from "../App";

type Props = {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
};

const navItems: Array<{ view: ActiveView; label: string; icon: typeof Gauge }> = [
  { view: "inicio", label: "Inicio", icon: Gauge },
  { view: "empresa", label: "Empresa", icon: Building2 },
  { view: "carpeta", label: "Carpeta Viva", icon: FileStack },
  { view: "sala", label: "Sala de Oferta", icon: SearchCheck }
];

export function Shell({ activeView, onNavigate }: Props) {
  return (
    <nav className="border-b border-lexum-line bg-[#fdfefe]">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 lg:px-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.view === activeView;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`focus-ring inline-flex min-w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-lexum-navy text-white" : "text-slate-600 hover:bg-lexum-mist hover:text-lexum-navy"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
