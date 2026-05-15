import { describe, expect, it } from "vitest";
import { calculateProviderScore } from "./score";
import type { CompanyDocument, CompanyProfile } from "./types";

const baseCompany: CompanyProfile = {
  razonSocial: "Servicios Demo SpA",
  rut: "76.123.456-7",
  nombreFantasia: "Demo",
  rubro: "Servicios de catering",
  productosServicios: "Catering, coffee break y arriendo de salon",
  regiones: ["Region del Maule"],
  capacidadOperativa: "Equipo para 250 personas por jornada",
  experienciaPrevia: "Contratos privados y publicos menores",
  inscritaRegistroProveedores: true,
  haVendidoEstado: true,
  montoAproximado: 12000000,
  contactoPrincipal: "Ana Perez",
  correo: "ana@example.com",
  telefono: "+56912345678"
};

const docs: CompanyDocument[] = [
  { documentTypeId: "constitucion_escritura", fileName: "escritura.pdf", status: "validado" },
  { documentTypeId: "certificado_vigencia", fileName: "vigencia.pdf", status: "validado" },
  { documentTypeId: "poderes", fileName: "poderes.pdf", status: "validado" },
  { documentTypeId: "rut_empresa", fileName: "rut.pdf", status: "validado" },
  { documentTypeId: "antecedentes_tributarios", fileName: "tributario.pdf", status: "validado" },
  { documentTypeId: "certificados_laborales_previsionales", fileName: "laboral.pdf", status: "validado" },
  { documentTypeId: "experiencia", fileName: "exp.pdf", status: "validado" },
  { documentTypeId: "fichas_tecnicas", fileName: "ficha.pdf", status: "validado" }
];

describe("calculateProviderScore", () => {
  it("returns advanced score for complete profile", () => {
    const result = calculateProviderScore(baseCompany, docs);
    expect(result.total).toBeGreaterThanOrEqual(85);
    expect(result.category).toBe("avanzado");
  });

  it("detects low readiness when company lacks core data", () => {
    const result = calculateProviderScore(
      {
        ...baseCompany,
        correo: "",
        telefono: "",
        rubro: "",
        productosServicios: "",
        regiones: [],
        inscritaRegistroProveedores: false,
        haVendidoEstado: false,
        experienciaPrevia: ""
      },
      []
    );
    expect(result.total).toBeLessThan(40);
    expect(result.gaps.length).toBeGreaterThan(0);
  });
});
