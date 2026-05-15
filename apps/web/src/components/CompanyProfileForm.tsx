import { useState } from "react";
import { Save } from "lucide-react";
import type { CompanyProfile } from "@proveedor-publico/shared";

type Props = {
  company: CompanyProfile;
  onSubmit: (company: CompanyProfile) => void;
  busy: boolean;
};

const regionOptions = [
  "Region de Arica y Parinacota",
  "Region de Tarapaca",
  "Region de Antofagasta",
  "Region de Atacama",
  "Region de Coquimbo",
  "Region de Valparaiso",
  "Region Metropolitana",
  "Region de O'Higgins",
  "Region del Maule",
  "Region de Nuble",
  "Region del Biobio",
  "Region de La Araucania",
  "Region de Los Rios",
  "Region de Los Lagos",
  "Region de Aysen",
  "Region de Magallanes"
];

export function CompanyProfileForm({ company, onSubmit, busy }: Props) {
  const [draft, setDraft] = useState(company);

  function update<Key extends keyof CompanyProfile>(key: Key, value: CompanyProfile[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
      className="grid gap-6 rounded-md border border-lexum-line bg-white p-5 shadow-panel"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-lexum-navy">Perfil de empresa</h2>
          <p className="text-sm text-slate-600">Datos base para score, radar y Sala de Oferta.</p>
        </div>
        <button disabled={busy} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-lexum-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          <Save size={17} />
          Guardar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Razon social" value={draft.razonSocial} onChange={(value) => update("razonSocial", value)} />
        <Field label="RUT" value={draft.rut} onChange={(value) => update("rut", value)} />
        <Field label="Nombre de fantasia" value={draft.nombreFantasia ?? ""} onChange={(value) => update("nombreFantasia", value)} />
        <Field label="Rubro" value={draft.rubro ?? ""} onChange={(value) => update("rubro", value)} />
        <Field label="Contacto principal" value={draft.contactoPrincipal ?? ""} onChange={(value) => update("contactoPrincipal", value)} />
        <Field label="Correo" value={draft.correo ?? ""} onChange={(value) => update("correo", value)} />
        <Field label="Telefono" value={draft.telefono ?? ""} onChange={(value) => update("telefono", value)} />
        <Field label="Monto aproximado ejecutable" type="number" value={String(draft.montoAproximado ?? "")} onChange={(value) => update("montoAproximado", Number(value))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextArea label="Productos / servicios ofrecidos" value={draft.productosServicios ?? ""} onChange={(value) => update("productosServicios", value)} />
        <TextArea label="Capacidad operativa" value={draft.capacidadOperativa ?? ""} onChange={(value) => update("capacidadOperativa", value)} />
        <TextArea label="Experiencia previa" value={draft.experienciaPrevia ?? ""} onChange={(value) => update("experienciaPrevia", value)} />
        <TextArea label="Observaciones" value={draft.observaciones ?? ""} onChange={(value) => update("observaciones", value)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="text-sm font-medium text-slate-700">Regiones donde opera</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {regionOptions.map((region) => (
              <label key={region} className="flex items-center gap-2 rounded-md border border-lexum-line px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.regiones.includes(region)}
                  onChange={(event) => {
                    update(
                      "regiones",
                      event.target.checked ? [...draft.regiones, region] : draft.regiones.filter((item) => item !== region)
                    );
                  }}
                />
                {region}
              </label>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-3">
          <Toggle label="Inscrita en Registro de Proveedores" checked={draft.inscritaRegistroProveedores} onChange={(value) => update("inscritaRegistroProveedores", value)} />
          <Toggle label="Ha vendido antes al Estado" checked={draft.haVendidoEstado} onChange={(value) => update("haVendidoEstado", value)} />
        </div>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="focus-ring rounded-md border border-lexum-line px-3 py-2 font-normal text-lexum-ink" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="focus-ring rounded-md border border-lexum-line px-3 py-2 font-normal text-lexum-ink" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-lexum-line px-4 py-3 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-lexum-navy" />
    </label>
  );
}
