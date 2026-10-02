import { describe, expect, it } from "vitest";

import { buildCompanySummary } from "@/shared/utils/company-summary";

describe("resumen empresarial", () => {
  it("arma la frase de Innova solo con campos presentes", () => {
    const summary = buildCompanySummary({
      estadoMatricula: "ACTIVA",
      fechaRenovacion: "2026-03-02",
      fechaConstitucion: "2018-02-20",
      tipoOrganizacion: "S.A.S.",
      actividadEconomicaCodigo: "6201",
      municipio: "Cali",
      tamanoEmpresa: "MEDIANA",
      numeroEmpleados: 48,
    });
    expect(summary).toBe("Matrícula activa, renovada en 2026, antigüedad desde 2018-02-20, S.A.S., CIIU 6201, Cali, mediana, 48 empleados.");
  });

  it("omite un campo nulo", () => {
    const summary = buildCompanySummary({
      estadoMatricula: "ACTIVA",
      fechaRenovacion: null,
      fechaConstitucion: null,
      tipoOrganizacion: "Fundación",
      actividadEconomicaCodigo: null,
      municipio: "Cali",
      tamanoEmpresa: null,
      numeroEmpleados: null,
    });
    expect(summary).toBe("Matrícula activa, Fundación, Cali.");
  });
});
