import type { TenderSummary } from "@proveedor-publico/shared";
import { env } from "../env.js";
import { parseDateForMercadoPublico } from "../utils/http.js";

type MercadoPublicoListadoResponse = {
  Cantidad: number;
  FechaCreacion: string;
  Version: string;
  Listado?: MercadoPublicoTender[];
};

type MercadoPublicoTender = {
  CodigoExterno: string;
  Nombre: string;
  CodigoEstado?: number;
  Descripcion?: string;
  Estado?: string;
  Comprador?: {
    CodigoOrganismo?: string;
    NombreOrganismo?: string;
    RegionUnidad?: string;
  };
  Fechas?: {
    FechaCierre?: string | null;
  };
  MontoEstimado?: number | null;
  Moneda?: string;
  Items?: {
    Listado?: Array<{
      NombreProducto?: string;
      Descripcion?: string;
      Categoria?: string;
    }>;
  };
};

export class MercadoPublicoService {
  constructor(
    private readonly ticket = env.MERCADO_PUBLICO_TICKET,
    private readonly baseUrl = env.MERCADO_PUBLICO_BASE_URL
  ) {}

  async getTenderByCode(code: string): Promise<TenderSummary | null> {
    const data = await this.request<MercadoPublicoListadoResponse>("/licitaciones.json", { codigo: code });
    const tender = data.Listado?.[0];
    return tender ? mapTender(tender) : null;
  }

  async listTendersByDate(date: string): Promise<TenderSummary[]> {
    const data = await this.request<MercadoPublicoListadoResponse>("/licitaciones.json", {
      fecha: parseDateForMercadoPublico(date)
    });
    return (data.Listado ?? []).map(mapTender);
  }

  async listTendersByState(state: string, date?: string): Promise<TenderSummary[]> {
    const params: Record<string, string> = { estado: state };
    if (date) params.fecha = parseDateForMercadoPublico(date);
    const data = await this.request<MercadoPublicoListadoResponse>("/licitaciones.json", params);
    return (data.Listado ?? []).map(mapTender);
  }

  async listTendersByBuyer(organismCode: string, date?: string): Promise<TenderSummary[]> {
    const params: Record<string, string> = { codigoOrganismo: organismCode };
    if (date) params.fecha = parseDateForMercadoPublico(date);
    const data = await this.request<MercadoPublicoListadoResponse>("/licitaciones.json", params);
    return (data.Listado ?? []).map(mapTender);
  }

  async listTendersByProvider(providerRut: string, date?: string): Promise<TenderSummary[]> {
    const params: Record<string, string> = { rutProveedor: providerRut };
    if (date) params.fecha = parseDateForMercadoPublico(date);
    const data = await this.request<MercadoPublicoListadoResponse>("/licitaciones.json", params);
    return (data.Listado ?? []).map(mapTender);
  }

  async getPurchaseOrderByCode(code: string) {
    return this.request("/ordenesdecompra.json", { codigo: code });
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set("ticket", this.ticket);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mercado Publico API responded ${response.status}`);
    }

    return (await response.json()) as T;
  }
}

export function mapTender(tender: MercadoPublicoTender): TenderSummary {
  return {
    codigoExterno: tender.CodigoExterno,
    nombre: tender.Nombre,
    descripcion: tender.Descripcion,
    estado: tender.Estado,
    codigoEstado: tender.CodigoEstado,
    organismoComprador: tender.Comprador?.NombreOrganismo,
    codigoOrganismo: tender.Comprador?.CodigoOrganismo,
    region: tender.Comprador?.RegionUnidad?.trim(),
    fechaCierre: tender.Fechas?.FechaCierre ?? null,
    montoEstimado: tender.MontoEstimado ?? null,
    moneda: tender.Moneda,
    productosServicios:
      tender.Items?.Listado?.map((item) => item.NombreProducto || item.Descripcion || item.Categoria || "no identificado").filter(Boolean) ?? [],
    raw: tender
  };
}
