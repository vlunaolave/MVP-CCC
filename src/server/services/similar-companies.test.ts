import { describe, expect, it } from "vitest";

import { rankSimilar, similarScore, type SimilarCandidate } from "@/server/services/similar-companies";

function company(partial: Partial<SimilarCandidate> & Pick<SimilarCandidate, "id" | "razonSocial">): SimilarCandidate {
  return {
    nit: "900000000-1",
    sector: "TECNOLOGIA",
    municipio: "Palmira",
    tamanoEmpresa: "MICRO",
    actividadEconomicaCodigo: "6311",
    revenue: null,
    ...partial,
  };
}

describe("empresas similares", () => {
  const innova = company({
    id: "co-innova",
    razonSocial: "INNOVA VALLE S.A.S.",
    municipio: "Cali",
    tamanoEmpresa: "MEDIANA",
    actividadEconomicaCodigo: "6201",
    revenue: 4200000000,
  });

  it("prioriza mismo CIIU y tamaño sobre el solo sector", () => {
    const cercana = company({
      id: "co-andina-soft",
      razonSocial: "Andina Software del Valle S.A.S.",
      municipio: "Cali",
      tamanoEmpresa: "MEDIANA",
      actividadEconomicaCodigo: "6201",
      revenue: 3800000000,
    });
    const soloSector = company({
      id: "co-nube",
      razonSocial: "Nube del Pacífico S.A.S.",
      actividadEconomicaCodigo: "6311",
      tamanoEmpresa: "PEQUENA",
      revenue: 900000000,
    });
    expect(similarScore(innova, cercana)).toBeGreaterThan(similarScore(innova, soloSector));
  });

  it("excluye la propia empresa y recorta a cinco", () => {
    const pool = [
      innova,
      ...["A", "B", "C", "D", "E", "F"].map((letter, index) =>
        company({
          id: `co-${letter}`,
          razonSocial: `Empresa ${letter}`,
          actividadEconomicaCodigo: "6201",
          tamanoEmpresa: "MEDIANA",
          revenue: 4000000000 - index,
        }),
      ),
    ];
    const ranked = rankSimilar(innova, pool);
    expect(ranked).toHaveLength(5);
    expect(ranked.some((item) => item.item.id === "co-innova")).toBe(false);
  });

  it("no revienta si el ingreso es cero", () => {
    const other = company({ id: "co-cero", razonSocial: "Cero Sistemas S.A.S.", revenue: 0 });
    expect(() => similarScore(company({ ...innova, revenue: 0 }), other)).not.toThrow();
    expect(similarScore(company({ ...innova, revenue: 0 }), other)).toBe(0);
  });
});
