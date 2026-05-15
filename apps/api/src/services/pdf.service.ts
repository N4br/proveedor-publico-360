import PDFDocument from "pdfkit";
import type { ProviderScoreResult, TenderAnalysisResult, TenderSummary } from "@proveedor-publico/shared";

const DISCLAIMER =
  "Proveedor Publico 360 no garantiza adjudicaciones ni reemplaza la responsabilidad del proveedor de revisar, completar y subir sus ofertas en Mercado Publico. El servicio entrega apoyo juridico-comercial, analisis documental, identificacion de riesgos y recomendaciones preliminares conforme a la informacion disponible y documentos proporcionados por el cliente.";

export async function generateProviderScorePdf(input: {
  companyName: string;
  rut: string;
  score: ProviderScoreResult;
}) {
  return renderPdf((doc) => {
    cover(doc, "Proveedor Publico 360", "Diagnostico Proveedor Publico");
    doc.fontSize(18).fillColor("#0b1f3a").text(input.companyName);
    doc.fontSize(10).fillColor("#4b5563").text(`RUT: ${input.rut}`);
    doc.moveDown();
    metric(doc, "Puntaje total", `${input.score.total}/100`, input.score.category.toUpperCase());
    section(doc, "Brechas principales");
    bulletList(doc, input.score.gaps.length ? input.score.gaps : ["Sin brechas criticas identificadas en el mock actual."]);
    section(doc, "Recomendaciones");
    bulletList(doc, input.score.recommendations);
    section(doc, "Acciones sugeridas");
    bulletList(doc, input.score.suggestedActions);
    disclaimer(doc);
  });
}

export async function generateTenderRoomPdf(input: {
  tender: TenderSummary;
  analysis: TenderAnalysisResult;
}) {
  return renderPdf((doc) => {
    cover(doc, "Proveedor Publico 360", "Reporte Sala de Oferta");
    doc.fontSize(16).fillColor("#0b1f3a").text(`${input.tender.codigoExterno} - ${input.tender.nombre}`);
    doc.fontSize(10).fillColor("#4b5563").text(`Comprador: ${input.tender.organismoComprador ?? "no identificado"}`);
    doc.moveDown();
    section(doc, "Resumen ejecutivo");
    doc.fontSize(10).fillColor("#111827").text(input.analysis.executiveSummary);
    section(doc, "Requisitos");
    bulletList(doc, input.analysis.requirements.map((item) => `${item.id}: ${item.requirement} (${item.status})`));
    section(doc, "Riesgos");
    bulletList(doc, input.analysis.risks.map((risk) => `${risk.level.toUpperCase()}: ${risk.title}. ${risk.mitigation ?? ""}`));
    section(doc, "Checklist previo");
    bulletList(doc, input.analysis.checklist.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.item}`));
    section(doc, "Recomendacion preliminar");
    doc.fontSize(12).fillColor("#0b1f3a").text(input.analysis.preliminaryRecommendation.replaceAll("_", " "));
    disclaimer(doc);
  });
}

function renderPdf(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    draw(doc);
    doc.end();
  });
}

function cover(doc: PDFKit.PDFDocument, brand: string, title: string) {
  doc.rect(0, 0, doc.page.width, 96).fill("#0b1f3a");
  doc.fillColor("#d7b56d").fontSize(15).text("LEXUM", 54, 32);
  doc.fillColor("#ffffff").fontSize(22).text(brand, 54, 52);
  doc.fillColor("#0b1f3a").fontSize(24).text(title, 54, 132);
  doc.moveDown(3);
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(1.2);
  doc.fillColor("#0b1f3a").fontSize(14).text(title);
  doc.moveDown(0.4);
}

function metric(doc: PDFKit.PDFDocument, label: string, value: string, caption: string) {
  doc.roundedRect(54, doc.y, 220, 72, 6).stroke("#d7b56d");
  doc.moveDown(0.8);
  doc.fillColor("#4b5563").fontSize(9).text(label, 72, doc.y);
  doc.fillColor("#0b1f3a").fontSize(28).text(value, 72, doc.y + 4);
  doc.fillColor("#4b5563").fontSize(9).text(caption, 72, doc.y + 2);
  doc.moveDown(1.5);
}

function bulletList(doc: PDFKit.PDFDocument, items: string[]) {
  items.slice(0, 12).forEach((item) => {
    doc.fillColor("#111827").fontSize(10).text(`- ${item}`, { indent: 8 });
  });
}

function disclaimer(doc: PDFKit.PDFDocument) {
  doc.moveDown(1.5);
  doc.fillColor("#6b7280").fontSize(8).text(DISCLAIMER, { align: "left" });
}
