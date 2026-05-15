import { randomUUID } from "node:crypto";
import { env } from "../env.js";
import { getSupabaseAdmin } from "../plugins/supabase.js";
import { sanitizeFileName } from "../utils/http.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
  "application/zip",
  "application/x-zip-compressed"
]);

export type UploadInput = {
  bucket: string;
  companyId?: string;
  tenderCode?: string;
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
};

export function validateUpload(fileName: string, mimeType: string | undefined, sizeBytes: number) {
  if (sizeBytes > 25 * 1024 * 1024) {
    throw new Error("El archivo supera el tamano maximo de 25 MB");
  }

  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Tipo de archivo no permitido: ${mimeType}`);
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  const allowedExtensions = new Set(["pdf", "doc", "docx", "xls", "xlsx", "csv", "jpg", "jpeg", "png", "zip"]);
  if (!extension || !allowedExtensions.has(extension)) {
    throw new Error("Extension de archivo no permitida");
  }
}

export async function uploadPrivateFile(input: UploadInput) {
  validateUpload(input.fileName, input.mimeType, input.buffer.byteLength);
  const supabase = getSupabaseAdmin();
  const cleanName = sanitizeFileName(input.fileName);
  const scope = input.companyId ? `companies/${input.companyId}` : `tenders/${input.tenderCode ?? "unknown"}`;
  const storagePath = `${scope}/${randomUUID()}-${cleanName}`;

  const { error } = await supabase.storage.from(input.bucket).upload(storagePath, input.buffer, {
    contentType: input.mimeType,
    upsert: false
  });

  if (error) throw error;

  return {
    bucket: input.bucket,
    storagePath,
    fileName: cleanName,
    sizeBytes: input.buffer.byteLength,
    mimeType: input.mimeType
  };
}

export const storageBuckets = {
  companyDocuments: env.SUPABASE_STORAGE_DOCUMENTS_BUCKET,
  tenderDocuments: env.SUPABASE_STORAGE_TENDER_BUCKET
};
