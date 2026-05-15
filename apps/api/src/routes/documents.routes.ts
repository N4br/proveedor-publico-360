import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { getUserContext } from "../plugins/auth.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../plugins/supabase.js";
import { storageBuckets, uploadPrivateFile } from "../services/storage.service.js";
import { toApiError } from "../utils/http.js";

export async function documentsRoutes(app: FastifyInstance) {
  app.get("/companies/:companyId/documents", async (request) => {
    await getUserContext(request);
    const { companyId } = request.params as { companyId: string };
    if (!isSupabaseConfigured()) return { data: [] };

    const { data, error } = await getSupabaseAdmin()
      .from("documents")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { data };
  });

  app.post("/companies/:companyId/documents", async (request) => {
    const user = await getUserContext(request);
    const { companyId } = request.params as { companyId: string };
    const file = await request.file();
    if (!file) throw toApiError("Archivo requerido");

    const documentTypeId = fieldValue(file.fields.documentTypeId) ?? "otros";
    const expirationDate = fieldValue(file.fields.expirationDate);
    const observations = fieldValue(file.fields.observations);
    const status = fieldValue(file.fields.status) ?? "cargado";
    const buffer = await file.toBuffer();

    if (!isSupabaseConfigured()) {
      return {
        data: {
          id: randomUUID(),
          company_id: companyId,
          document_type_id: documentTypeId,
          file_name: file.filename,
          status,
          size_bytes: buffer.byteLength
        }
      };
    }

    const uploaded = await uploadPrivateFile({
      bucket: storageBuckets.companyDocuments,
      companyId,
      fileName: file.filename,
      mimeType: file.mimetype,
      buffer
    });

    const { data, error } = await getSupabaseAdmin()
      .from("documents")
      .insert({
        company_id: companyId,
        uploaded_by: user.id === "00000000-0000-0000-0000-000000000000" ? null : user.id,
        document_type_id: documentTypeId,
        status,
        file_name: uploaded.fileName,
        storage_bucket: uploaded.bucket,
        storage_path: uploaded.storagePath,
        mime_type: uploaded.mimeType,
        size_bytes: uploaded.sizeBytes,
        expiration_date: expirationDate || null,
        observations
      })
      .select()
      .single();
    if (error) throw error;
    return { data };
  });
}

function fieldValue(field: unknown) {
  if (!field || typeof field !== "object") return undefined;
  const value = (field as { value?: unknown }).value;
  return typeof value === "string" ? value : undefined;
}
