import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUserContext } from "../plugins/auth.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../plugins/supabase.js";
import { toApiError } from "../utils/http.js";

const companySchema = z.object({
  razonSocial: z.string().min(2),
  rut: z.string().min(6),
  nombreFantasia: z.string().optional(),
  rubro: z.string().optional(),
  productosServicios: z.string().optional(),
  regiones: z.array(z.string()).default([]),
  capacidadOperativa: z.string().optional(),
  experienciaPrevia: z.string().optional(),
  inscritaRegistroProveedores: z.boolean().default(false),
  haVendidoEstado: z.boolean().default(false),
  montoAproximado: z.number().optional(),
  contactoPrincipal: z.string().optional(),
  correo: z.string().email().optional().or(z.literal("")),
  telefono: z.string().optional(),
  observaciones: z.string().optional()
});

export async function companyRoutes(app: FastifyInstance) {
  app.get("/companies", async (request) => {
    const user = await getUserContext(request);
    if (!isSupabaseConfigured()) return { data: [] };
    const supabase = getSupabaseAdmin();

    if (user.role === "admin" || user.role === "revisor_lexum") {
      const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return { data };
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("status", "active");
    if (membershipsError) throw membershipsError;

    const companyIds = memberships?.map((membership) => membership.company_id).filter(Boolean) ?? [];
    if (!companyIds.length) return { data: [] };

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .in("id", companyIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { data };
  });

  app.post("/companies", async (request) => {
    const user = await getUserContext(request);
    const payload = companySchema.parse(request.body);
    if (!isSupabaseConfigured()) return { data: { id: "local-company", ...payload } };

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("companies")
      .insert(toCompanyRow(payload))
      .select()
      .single();
    if (error) throw error;

    await supabase.from("company_members").insert({
      company_id: data.id,
      user_id: user.id,
      member_role: "owner"
    });

    return { data };
  });

  app.get("/companies/:id", async (request) => {
    await getUserContext(request);
    const id = (request.params as { id: string }).id;
    if (!isSupabaseConfigured()) throw toApiError("Supabase no configurado para cargar empresas", 503);

    const { data, error } = await getSupabaseAdmin().from("companies").select("*").eq("id", id).single();
    if (error) throw error;
    return { data };
  });

  app.put("/companies/:id", async (request) => {
    await getUserContext(request);
    const id = (request.params as { id: string }).id;
    const payload = companySchema.parse(request.body);
    if (!isSupabaseConfigured()) return { data: { id, ...payload } };

    const { data, error } = await getSupabaseAdmin()
      .from("companies")
      .update(toCompanyRow(payload))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  });
}

function toCompanyRow(payload: z.infer<typeof companySchema>) {
  return {
    razon_social: payload.razonSocial,
    rut: payload.rut,
    nombre_fantasia: payload.nombreFantasia,
    rubro: payload.rubro,
    productos_servicios: payload.productosServicios,
    regiones: payload.regiones,
    capacidad_operativa: payload.capacidadOperativa,
    experiencia_previa: payload.experienciaPrevia,
    inscrita_registro_proveedores: payload.inscritaRegistroProveedores,
    ha_vendido_estado: payload.haVendidoEstado,
    monto_aproximado: payload.montoAproximado,
    contacto_principal: payload.contactoPrincipal,
    correo: payload.correo,
    telefono: payload.telefono,
    observaciones: payload.observaciones
  };
}
