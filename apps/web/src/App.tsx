import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  calculateProviderScore,
  type AttachmentExtractionResult,
  type CompanyDocument,
  type CompanyProfile,
  type TenderAnalysisResult,
  type TenderSummary
} from "@proveedor-publico/shared";
import { supabase } from "./lib/supabase";
import { apiRequest } from "./lib/api";
import { CompanyProfileForm } from "./components/CompanyProfileForm";
import { DocumentVault } from "./components/DocumentVault";
import { Header } from "./components/Header";
import { PortalHome } from "./components/PortalHome";
import { ProviderScorePanel } from "./components/ProviderScorePanel";
import { Shell } from "./components/Shell";
import { TenderRoomPanel } from "./components/TenderRoomPanel";

const initialCompany: CompanyProfile = {
  id: "local-company",
  razonSocial: "Servicios Demo SpA",
  rut: "76.123.456-7",
  nombreFantasia: "Demo Catering",
  rubro: "Servicios de catering",
  productosServicios: "Coffee break, almuerzos y arriendo de salon para capacitaciones",
  regiones: ["Region del Maule", "Region Metropolitana"],
  capacidadOperativa: "Equipo para 220 asistentes por jornada",
  experienciaPrevia: "Servicios privados y eventos corporativos",
  inscritaRegistroProveedores: true,
  haVendidoEstado: false,
  montoAproximado: 12000000,
  contactoPrincipal: "Ana Perez",
  correo: "ana@example.com",
  telefono: "+56912345678",
  observaciones: "Perfil de demo editable."
};

export type ActiveView = "inicio" | "empresa" | "carpeta" | "sala";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("inicio");
  const [company, setCompany] = useState<CompanyProfile>(initialCompany);
  const [documents, setDocuments] = useState<CompanyDocument[]>([
    { documentTypeId: "constitucion_escritura", fileName: "escritura-demo.pdf", status: "validado" },
    { documentTypeId: "rut_empresa", fileName: "rut-demo.pdf", status: "cargado" },
    { documentTypeId: "fichas_tecnicas", fileName: "ficha-servicio.pdf", status: "requiere_revision" }
  ]);
  const [tender, setTender] = useState<TenderSummary | null>(null);
  const [extraction, setExtraction] = useState<AttachmentExtractionResult | null>(null);
  const [analysis, setAnalysis] = useState<TenderAnalysisResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const score = useMemo(() => calculateProviderScore(company, documents), [company, documents]);
  const token = session?.access_token ?? null;

  async function saveCompany(nextCompany: CompanyProfile) {
    setBusy("company");
    setMessage(null);
    try {
      setCompany(nextCompany);
      if (token) {
        const response = await apiRequest<{ data: unknown }>(
          nextCompany.id && nextCompany.id !== "local-company" ? `/companies/${nextCompany.id}` : "/companies",
          { method: nextCompany.id && nextCompany.id !== "local-company" ? "PUT" : "POST", body: JSON.stringify(nextCompany) },
          token
        );
        setMessage("Perfil empresa guardado.");
        const row = response.data as { id?: string };
        if (row.id) setCompany({ ...nextCompany, id: row.id });
      } else {
        setMessage("Perfil actualizado en modo local.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar empresa.");
    } finally {
      setBusy(null);
    }
  }

  async function uploadDocument(input: { file: File; documentTypeId: CompanyDocument["documentTypeId"]; status: CompanyDocument["status"] }) {
    setBusy("document");
    setMessage(null);
    try {
      if (token && company.id && company.id !== "local-company") {
        const form = new FormData();
        form.append("file", input.file);
        form.append("documentTypeId", input.documentTypeId);
        form.append("status", input.status);
        const response = await apiRequest<{ data: { id: string; file_name: string; document_type_id: CompanyDocument["documentTypeId"]; status: CompanyDocument["status"]; size_bytes?: number } }>(
          `/companies/${company.id}/documents`,
          { method: "POST", body: form },
          token
        );
        setDocuments((current) => [
          {
            id: response.data.id,
            fileName: response.data.file_name,
            documentTypeId: response.data.document_type_id,
            status: response.data.status,
            sizeBytes: response.data.size_bytes
          },
          ...current
        ]);
      } else {
        setDocuments((current) => [
          {
            id: crypto.randomUUID(),
            fileName: input.file.name,
            documentTypeId: input.documentTypeId,
            status: input.status,
            sizeBytes: input.file.size,
            uploadedAt: new Date().toISOString()
          },
          ...current
        ]);
      }
      setMessage("Documento incorporado a Carpeta Viva.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo subir documento.");
    } finally {
      setBusy(null);
    }
  }

  async function fetchTender(code: string) {
    setBusy("tender");
    setMessage(null);
    setAnalysis(null);
    setExtraction(null);
    try {
      const response = await apiRequest<{ data: TenderSummary }>(`/tenders/${encodeURIComponent(code)}`, {}, token);
      setTender(response.data);
      setMessage("Licitacion consultada en Mercado Publico.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo consultar licitacion.");
    } finally {
      setBusy(null);
    }
  }

  async function createTenderRoom(code: string) {
    setBusy("room");
    setMessage(null);
    try {
      const response = await apiRequest<{ data: { tender: TenderSummary; extraction: AttachmentExtractionResult; fallbackRequired: boolean } }>(
        "/tender-rooms",
        { method: "POST", body: JSON.stringify({ companyId: company.id ?? "local-company", tenderCode: code }) },
        token
      );
      setTender(response.data.tender);
      setExtraction(response.data.extraction);
      setMessage(response.data.fallbackRequired ? "Sala creada con fallback manual de documentos." : "Sala creada con adjuntos recuperados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear Sala de Oferta.");
    } finally {
      setBusy(null);
    }
  }

  async function runAnalysis() {
    if (!tender) return;
    setBusy("analysis");
    setMessage(null);
    try {
      const response = await apiRequest<{ data: TenderAnalysisResult }>(
        "/analyze-tender-documents",
        { method: "POST", body: JSON.stringify({ tender, documents }) },
        token
      );
      setAnalysis(response.data);
      setMessage("Analisis preliminar generado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo generar analisis.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadScorePdf() {
    setBusy("pdf");
    setMessage(null);
    try {
      const blob = await apiRequest<Blob>(
        "/reports/provider-score",
        { method: "POST", body: JSON.stringify({ companyName: company.razonSocial, rut: company.rut, score }) },
        token
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "diagnostico-proveedor-publico-360.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("Informe PDF generado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo generar PDF.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <Header session={session} />
      <Shell activeView={activeView} onNavigate={setActiveView} />
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:px-8">
        {message ? <div className="rounded-md border border-lexum-line bg-white px-4 py-3 text-sm text-lexum-ink shadow-panel">{message}</div> : null}

        {activeView === "inicio" ? (
          <PortalHome company={company} score={score} documents={documents} tender={tender} onNavigate={setActiveView} onDownloadScorePdf={downloadScorePdf} busy={busy} />
        ) : null}

        {activeView === "empresa" ? <CompanyProfileForm company={company} onSubmit={saveCompany} busy={busy === "company"} /> : null}

        {activeView === "carpeta" ? (
          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <ProviderScorePanel score={score} onDownloadPdf={downloadScorePdf} busy={busy === "pdf"} />
            <DocumentVault documents={documents} onUpload={uploadDocument} busy={busy === "document"} />
          </div>
        ) : null}

        {activeView === "sala" ? (
          <TenderRoomPanel
            tender={tender}
            extraction={extraction}
            analysis={analysis}
            busy={busy}
            onFetchTender={fetchTender}
            onCreateRoom={createTenderRoom}
            onAnalyze={runAnalysis}
          />
        ) : null}
      </main>
    </div>
  );
}
