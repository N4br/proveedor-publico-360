import { useState } from "react";
import { Upload } from "lucide-react";
import { DOCUMENT_TYPES, type CompanyDocument } from "@proveedor-publico/shared";

type Props = {
  documents: CompanyDocument[];
  onUpload: (input: { file: File; documentTypeId: CompanyDocument["documentTypeId"]; status: CompanyDocument["status"] }) => void;
  busy: boolean;
};

const statuses: CompanyDocument["status"][] = ["cargado", "faltante", "vencido", "incompleto", "requiere_revision", "validado"];

export function DocumentVault({ documents, onUpload, busy }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [documentTypeId, setDocumentTypeId] = useState<CompanyDocument["documentTypeId"]>("otros");
  const [status, setStatus] = useState<CompanyDocument["status"]>("cargado");

  return (
    <section className="rounded-md border border-lexum-line bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-lexum-navy">Carpeta Viva</h2>
          <p className="text-sm text-slate-600">Matriz documental privada por empresa.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-md border border-lexum-line bg-lexum-mist p-3 lg:grid-cols-[1fr_0.8fr_0.7fr_auto]">
        <input className="focus-ring rounded-md border border-lexum-line bg-white px-3 py-2 text-sm" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <select className="focus-ring rounded-md border border-lexum-line bg-white px-3 py-2 text-sm" value={documentTypeId} onChange={(event) => setDocumentTypeId(event.target.value as CompanyDocument["documentTypeId"])}>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <select className="focus-ring rounded-md border border-lexum-line bg-white px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value as CompanyDocument["status"])}>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item.replace("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!file || busy}
          onClick={() => file && onUpload({ file, documentTypeId, status })}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-lexum-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          <Upload size={17} />
          Subir
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-lexum-line">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-lexum-navy text-white">
            <tr>
              <th className="px-3 py-3 font-medium">Documento</th>
              <th className="px-3 py-3 font-medium">Tipo</th>
              <th className="px-3 py-3 font-medium">Estado</th>
              <th className="px-3 py-3 font-medium">Vencimiento</th>
              <th className="px-3 py-3 font-medium">Tamano</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-lexum-line bg-white">
            {documents.map((document) => (
              <tr key={document.id ?? `${document.fileName}-${document.documentTypeId}`}>
                <td className="px-3 py-3 font-medium text-lexum-ink">{document.fileName}</td>
                <td className="px-3 py-3 text-slate-600">{DOCUMENT_TYPES.find((type) => type.id === document.documentTypeId)?.name ?? document.documentTypeId}</td>
                <td className="px-3 py-3">
                  <span className="rounded-md bg-lexum-mist px-2 py-1 text-xs font-medium text-lexum-navy">{document.status.replace("_", " ")}</span>
                </td>
                <td className="px-3 py-3 text-slate-600">{document.expirationDate ?? "no registrado"}</td>
                <td className="px-3 py-3 text-slate-600">{document.sizeBytes ? `${Math.round(document.sizeBytes / 1024)} KB` : "no registrado"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
