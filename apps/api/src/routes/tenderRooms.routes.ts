import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUserContext } from "../plugins/auth.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../plugins/supabase.js";
import { MercadoPublicoAttachmentExtractor } from "../services/attachmentExtractor.service.js";
import { MercadoPublicoService } from "../services/mercadoPublico.service.js";
import { upsertTender } from "../services/tenderPersistence.service.js";
import { toApiError } from "../utils/http.js";

const createRoomSchema = z.object({
  companyId: z.string().min(1),
  tenderCode: z.string().min(5)
});

export async function tenderRoomsRoutes(app: FastifyInstance) {
  const mercadoPublico = new MercadoPublicoService();
  const extractor = new MercadoPublicoAttachmentExtractor();

  app.post("/tender-rooms", async (request) => {
    const user = await getUserContext(request);
    const payload = createRoomSchema.parse(request.body);
    const tender = await mercadoPublico.getTenderByCode(payload.tenderCode);
    if (!tender) throw toApiError("Licitacion no encontrada", 404);
    const tenderRow = await upsertTender(tender);
    const extraction = await extractor.extract(payload.tenderCode);

    if (!isSupabaseConfigured() || !tenderRow) {
      return {
        data: {
          id: "local-room",
          companyId: payload.companyId,
          tender,
          extraction,
          fallbackRequired: extraction.status !== "ok"
        }
      };
    }

    const { data: room, error } = await getSupabaseAdmin()
      .from("tender_rooms")
      .insert({
        company_id: payload.companyId,
        tender_id: tenderRow.id,
        created_by: user.id === "00000000-0000-0000-0000-000000000000" ? null : user.id,
        extraction_status: extraction.status,
        extraction_notes: extraction.notes.join("\n"),
        metadata: { extraction }
      })
      .select()
      .single();
    if (error) throw error;

    if (extraction.attachments.length) {
      await getSupabaseAdmin().from("tender_attachments").insert(
        extraction.attachments.map((attachment) => ({
          tender_id: tenderRow.id,
          tender_room_id: room.id,
          file_name: attachment.fileName,
          source_url: attachment.sourceUrl,
          storage_bucket: attachment.storageBucket,
          storage_path: attachment.storagePath,
          mime_type: attachment.mimeType,
          size_bytes: attachment.sizeBytes,
          downloaded_at: attachment.downloadedAt,
          status: extraction.status === "ok" ? "downloaded" : "discovered",
          metadata: attachment.metadata ?? {}
        }))
      );
    }

    return { data: { ...room, tender, extraction, fallbackRequired: extraction.status !== "ok" } };
  });

  app.get("/tender-rooms/:id", async (request) => {
    await getUserContext(request);
    const id = (request.params as { id: string }).id;
    if (!isSupabaseConfigured()) throw toApiError("Supabase no configurado para cargar sala", 503);

    const { data, error } = await getSupabaseAdmin()
      .from("tender_rooms")
      .select("*, tenders(*), tender_attachments(*), tender_analysis(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { data };
  });
}
