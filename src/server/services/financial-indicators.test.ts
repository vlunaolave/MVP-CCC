import { describe, expect, it } from "vitest";

import {
  difference,
  formatPercent,
  formatTimes,
  formatVariation,
  indicatorsFor,
  ratio,
  type PeriodAmounts,
} from "@/server/services/financial-indicators";

function period(partial: Partial<PeriodAmounts> & Pick<PeriodAmounts, "year">): PeriodAmounts {
  return {
    revenue: 100,
    ebitda: 20,
    netProfit: 10,
    totalAssets: 50,
    totalLiabilities: 20,
    equity: 30,
    employees: 10,
    currentAssets: 15,
    currentLiabilities: 10,
    ...partial,
  };
}

describe("indicadores financieros", () => {
  it("devuelve null si el denominador es cero", () => {
    expect(ratio(10, 0)).toBeNull();
    expect(indicatorsFor([period({ year: 2025, revenue: 0, equity: 0, totalAssets: 0, currentLiabilities: 0 })])).toMatchObject({
      margenNeto: null,
      margenOperativo: null,
      roa: null,
      roe: null,
      razonCorriente: null,
      deudaPatrimonio: null,
    });
  });

  it("deja la razón corriente en null si falta un corriente", () => {
    const result = indicatorsFor([period({ year: 2025, currentAssets: null })]);
    expect(result.razonCorriente).toBeNull();
  });

  it("deja los crecimientos en null si no hay año previo", () => {
    const result = indicatorsFor([period({ year: 2025 })]);
    expect(result.crecimientoIngresos).toBeNull();
    expect(result.crecimientoActivos).toBeNull();
  });

  it("calcula el crecimiento de Innova 2025 contra 2024", () => {
    const result = indicatorsFor([
      period({ year: 2024, revenue: 3700000000, totalAssets: 1720000000 }),
      period({
        year: 2025,
        revenue: 4200000000,
        ebitda: 760000000,
        netProfit: 470000000,
        totalAssets: 1980000000,
        totalLiabilities: 640000000,
        equity: 1340000000,
        currentAssets: 890000000,
        currentLiabilities: 320000000,
      }),
    ]);
    expect(result.crecimientoIngresos).toBeCloseTo(500000000 / 3700000000);
    expect(formatPercent(result.crecimientoIngresos, true)).toBe("+13,5 %");
    expect(formatVariation(result.crecimientoIngresos, 2024)).toBe("+13,5 % vs 2024");
    expect(formatTimes(result.razonCorriente)).toBe("2,8");
    expect(formatPercent(0, true)).toBe("0,0 %");
  });

  it("no formatea NaN ni Infinity", () => {
    expect(formatPercent(Number.NaN)).toBe("N/D");
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe("N/D");
    expect(formatTimes(Number.NEGATIVE_INFINITY)).toBe("N/D");
    expect(difference(10, 0).porcentual).toBeNull();
  });
});
