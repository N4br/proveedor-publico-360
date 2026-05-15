import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import * as cheerio from "cheerio";
import type { AttachmentExtractionResult, TenderAttachmentMetadata } from "@proveedor-publico/shared";
import { env } from "../env.js";
import { sanitizeFileName } from "../utils/http.js";

const PORTAL_BASE = "https://www.mercadopublico.cl";

export class MercadoPublicoAttachmentExtractor {
  async extract(tenderCode: string): Promise<AttachmentExtractionResult> {
    const detailsUrl = `${PORTAL_BASE}/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${encodeURIComponent(tenderCode)}`;
    const notes: string[] = [];

    try {
      const detailsResponse = await fetch(detailsUrl);
      if (!detailsResponse.ok) {
        return {
          tenderCode,
          status: "error_portal",
          method: "html_discovery",
          detailsUrl,
          portalStatusCode: detailsResponse.status,
          attachments: [],
          notes: [`La ficha publica respondio HTTP ${detailsResponse.status}`]
        };
      }

      const detailsHtml = await detailsResponse.text();
      const gatewayUrl = discoverAttachmentGateway(detailsHtml, detailsUrl);
      if (!gatewayUrl) {
        return {
          tenderCode,
          status: "adjuntos_no_disponibles_automaticamente",
          method: "html_discovery",
          detailsUrl,
          attachments: [],
          notes: ["No se encontro enlace/boton publico de adjuntos en la ficha."]
        };
      }

      notes.push("Se encontro gateway publico de adjuntos en HTML de ficha.");
      const gatewayResponse = await fetch(gatewayUrl, { headers: { "user-agent": userAgent() } });
      const gatewayHtml = await gatewayResponse.text();

      if (detectCaptchaOrDenied(gatewayHtml)) {
        notes.push("El gateway de adjuntos exige reCAPTCHA Enterprise o muestra acceso denegado/robot.");
        if (!env.MERCADO_PUBLICO_ALLOW_HEADLESS_ATTACHMENTS) {
          return {
            tenderCode,
            status: "captcha_o_sesion_requerida",
            method: "html_discovery",
            detailsUrl,
            attachmentGatewayUrl: gatewayUrl,
            portalStatusCode: gatewayResponse.status,
            attachments: [],
            notes: [
              ...notes,
              "Extractor headless deshabilitado. Se debe solicitar carga manual de bases/anexos."
            ]
          };
        }

        return this.extractWithPlaywright(tenderCode, detailsUrl, gatewayUrl, notes);
      }

      const attachments = discoverDownloadLinks(gatewayHtml, gatewayUrl, tenderCode);
      if (!attachments.length) {
        return {
          tenderCode,
          status: "requiere_carga_manual",
          method: "html_discovery",
          detailsUrl,
          attachmentGatewayUrl: gatewayUrl,
          portalStatusCode: gatewayResponse.status,
          attachments: [],
          notes: [...notes, "La vista de adjuntos cargo, pero no expuso enlaces de descarga parseables."]
        };
      }

      const downloaded = await this.tryDownloadDiscoveredFiles(attachments, notes);
      return {
        tenderCode,
        status: downloaded.length ? "ok" : "requiere_carga_manual",
        method: "html_discovery",
        detailsUrl,
        attachmentGatewayUrl: gatewayUrl,
        portalStatusCode: gatewayResponse.status,
        attachments: downloaded.length ? downloaded : attachments,
        notes
      };
    } catch (error) {
      return {
        tenderCode,
        status: "error_portal",
        method: "html_discovery",
        detailsUrl,
        attachments: [],
        notes: [`Error consultando portal: ${error instanceof Error ? error.message : "desconocido"}`]
      };
    }
  }

  private async extractWithPlaywright(
    tenderCode: string,
    detailsUrl: string,
    gatewayUrl: string,
    notes: string[]
  ): Promise<AttachmentExtractionResult> {
    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ acceptDownloads: true, userAgent: userAgent() });
      const page = await context.newPage();
      const downloads: TenderAttachmentMetadata[] = [];

      page.on("download", async (download) => {
        const suggested = sanitizeFileName(download.suggestedFilename());
        const path = join(env.ATTACHMENTS_DOWNLOAD_DIR, tenderCode, suggested);
        await mkdir(dirname(path), { recursive: true });
        await download.saveAs(path);
        downloads.push({
          fileName: suggested,
          sourceUrl: download.url(),
          downloadedAt: new Date().toISOString(),
          tenderCode,
          storagePath: path
        });
      });

      await page.goto(detailsUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

      const popupPromise = page.waitForEvent("popup", { timeout: 15000 }).catch(() => null);
      const clicked = await page.locator("#imgAdjuntos").click({ timeout: 10000 }).then(() => true).catch(() => false);
      const popup = clicked ? await popupPromise : null;
      const activePage = popup ?? page;

      if (!popup) {
        await activePage.goto(gatewayUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
      }

      await activePage.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => undefined);
      const html = await activePage.content();
      await browser.close();

      if (detectCaptchaOrDenied(html)) {
        return {
          tenderCode,
          status: "captcha_o_sesion_requerida",
          method: "playwright",
          detailsUrl,
          attachmentGatewayUrl: gatewayUrl,
          attachments: downloads,
          notes: [...notes, "Playwright no supero validacion reCAPTCHA/robot de forma normal."]
        };
      }

      const links = discoverDownloadLinks(html, activePage.url(), tenderCode);
      return {
        tenderCode,
        status: downloads.length || links.length ? "ok" : "requiere_carga_manual",
        method: "playwright",
        detailsUrl,
        attachmentGatewayUrl: gatewayUrl,
        attachments: downloads.length ? downloads : links,
        notes: downloads.length || links.length ? notes : [...notes, "No se detectaron descargas luego de navegar con Playwright."]
      };
    } catch (error) {
      return {
        tenderCode,
        status: "error_portal",
        method: "playwright",
        detailsUrl,
        attachmentGatewayUrl: gatewayUrl,
        attachments: [],
        notes: [...notes, `Error Playwright: ${error instanceof Error ? error.message : "desconocido"}`]
      };
    }
  }

  private async tryDownloadDiscoveredFiles(attachments: TenderAttachmentMetadata[], notes: string[]) {
    const downloaded: TenderAttachmentMetadata[] = [];

    for (const attachment of attachments) {
      if (!attachment.sourceUrl) continue;
      try {
        const response = await fetch(attachment.sourceUrl, { headers: { "user-agent": userAgent() } });
        const contentType = response.headers.get("content-type") ?? undefined;
        const isHtml = contentType?.includes("text/html");
        if (!response.ok || isHtml) continue;
        const buffer = Buffer.from(await response.arrayBuffer());
        const fileName = sanitizeFileName(attachment.fileName || `adjunto-${downloaded.length + 1}`);
        const path = join(env.ATTACHMENTS_DOWNLOAD_DIR, attachment.tenderCode, fileName);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, buffer);
        downloaded.push({
          ...attachment,
          fileName,
          mimeType: contentType,
          sizeBytes: buffer.byteLength,
          downloadedAt: new Date().toISOString(),
          storagePath: path
        });
      } catch {
        notes.push(`No se pudo descargar automaticamente ${attachment.fileName}.`);
      }
    }

    return downloaded;
  }
}

export function discoverAttachmentGateway(html: string, detailsUrl: string) {
  const $ = cheerio.load(html);
  const candidates: string[] = [];

  $("[href], [onclick]").each((_, element) => {
    const href = $(element).attr("href");
    const onclick = $(element).attr("onclick");
    if (href?.includes("ViewAttachment.aspx")) candidates.push(href);
    const onclickMatch = onclick?.match(/((?:\.\.\/)?Attachment\/ViewAttachment\.aspx\?enc=[^'"]+|ViewAttachment\.aspx\?enc=[^'"]+)/i);
    if (onclickMatch?.[0]) candidates.push(onclickMatch[0]);
  });

  const rawMatch = html.match(/(?:\.\.\/)?Attachment\/ViewAttachment\.aspx\?enc=([^'"&]+)(?:&#39;|['"]|&)/i);
  if (rawMatch?.[0]) candidates.push(rawMatch[0].replace(/&#39;.*/, ""));

  const first = candidates.find((candidate) => candidate.includes("Attachment/ViewAttachment.aspx")) ?? candidates.find(Boolean);
  if (!first) return null;
  return new URL(first.replace(/&amp;/g, "&"), detailsUrl).toString();
}

export function detectCaptchaOrDenied(html: string) {
  const lower = html.toLowerCase();
  return (
    lower.includes("recaptcha/enterprise") ||
    lower.includes("grecaptcha.enterprise") ||
    lower.includes("/procurement/403.html") ||
    lower.includes("acceso denegado") ||
    lower.includes("robot.png") ||
    lower.includes("login-required")
  );
}

export function discoverDownloadLinks(html: string, baseUrl: string, tenderCode: string): TenderAttachmentMetadata[] {
  const $ = cheerio.load(html);
  const links: TenderAttachmentMetadata[] = [];

  $("a[href], input[href], button[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    const text = ($(element).text() || $(element).attr("value") || $(element).attr("title") || "adjunto").trim();
    if (!/download|descarg|attach|att|document|doc|pdf|xls|zip|ashx/i.test(href + text)) return;
    const sourceUrl = new URL(href.replace(/&amp;/g, "&"), baseUrl).toString();
    links.push({
      fileName: sanitizeFileName(text || sourceUrl.split("/").pop() || "adjunto"),
      sourceUrl,
      tenderCode,
      metadata: { discoveredFrom: baseUrl }
    });
  });

  return dedupeLinks(links);
}

function dedupeLinks(links: TenderAttachmentMetadata[]) {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = link.sourceUrl ?? link.fileName;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function userAgent() {
  return "ProveedorPublico360/0.1 (+LEXUM; public tender document discovery)";
}
