import type { TenderSummary } from "@proveedor-publico/shared";
import { isSupabaseConfigured, getSupabaseAdmin } from "../plugins/supabase.js";

export async function upsertTender(tender: TenderSummary) {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tenders")
    .upsert(
      {
        codigo_externo: tender.codigoExterno,
        nombre: tender.nombre,
        descripcion: tender.descripcion,
        estado: tender.estado,
        codigo_estado: tender.codigoEstado,
        organismo_comprador: tender.organismoComprador,
        codigo_organismo: tender.codigoOrganismo,
        region: tender.region,
        fecha_cierre: tender.fechaCierre,
        monto_estimado: tender.montoEstimado,
        moneda: tender.moneda,
        raw_payload: tender.raw ?? {}
      },
      { onConflict: "codigo_externo" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTenderRowByCode(code: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("tenders").select("*").eq("codigo_externo", code).maybeSingle();
  if (error) throw error;
  return data;
}
