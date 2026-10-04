import { describe, expect, it } from "vitest";

import { companies } from "../../../prisma/data/companies";
import { financials } from "../../../prisma/data/financials";
import { unspscClassifications } from "../../../prisma/data/unspsc";
import { indicatorsFor, type PeriodAmounts } from "@/server/services/financial-indicators";

function amounts(row: (typeof financials)[number]): PeriodAmounts {
  return {
    year: row.year,
    cutoffDate: row.cutoffDate,
    revenue: row.revenue,
    ebitda: row.ebitda,
    operatingProfit: row.operatingProfit,
    interestExpense: row.interestExpense,
    netProfit: row.netProfit,
    totalAssets: row.totalAssets,
    totalLiabilities: row.totalLiabilities,
    equity: row.equity,
    employees: row.employees,
    currentAssets: row.currentAssets ?? null,
    currentLiabilities: row.currentLiabilities ?? null,
    fuenteDatos: "DEMO",
  };
}

describe("estados de demostración", () => {
  it("cuadra el balance y mantiene corrientes dentro del total", () => {
    for (const row of financials) {
      expect(row.totalAssets).toBe(row.totalLiabilities + row.equity);
      expect(row.currentAssets ?? 0).toBeLessThanOrEqual(row.totalAssets);
      expect(row.currentLiabilities ?? 0).toBeLessThanOrEqual(row.totalLiabilities);
      expect(row.interestExpense).toBeGreaterThan(0);
      expect(row.revenue).toBeGreaterThan(0);
    }
  });

  it("deja a Innova con cinco periodos y todos los indicadores", () => {
    const innova = financials.filter((row) => row.companyId === "co-innova").map(amounts);
    expect(innova.map((row) => row.year)).toEqual([2021, 2022, 2023, 2024, 2025]);
    const indicators = indicatorsFor(innova);
    expect(indicators.razonCorriente).not.toBeNull();
    expect(indicators.capitalTrabajo).not.toBeNull();
    expect(indicators.nivelEndeudamiento).not.toBeNull();
    expect(indicators.deudaPatrimonio).not.toBeNull();
    expect(indicators.margenOperativo).not.toBeNull();
    expect(indicators.margenNeto).not.toBeNull();
    expect(indicators.roa).not.toBeNull();
    expect(indicators.roe).not.toBeNull();
    expect(indicators.coberturaIntereses).not.toBeNull();
    expect(indicators.crecimientoIngresos).not.toBeNull();
    expect(indicators.crecimientoActivos).not.toBeNull();
    expect(indicators.crecimientoPatrimonio).not.toBeNull();
    const codes = unspscClassifications.filter((item) => item.companyId === "co-innova");
    expect(codes.length).toBeGreaterThan(1);
    expect(codes.filter((item) => item.isPrimary)).toHaveLength(1);
  });

  it("calcula indicadores para todas las empresas", () => {
    const covered = new Set(financials.map((row) => row.companyId));
    expect(covered.size).toBe(companies.length);
    for (const companyId of covered) {
      const rows = financials.filter((row) => row.companyId === companyId).map(amounts);
      const indicators = indicatorsFor(rows);
      expect(indicators.razonCorriente).not.toBeNull();
      expect(indicators.nivelEndeudamiento).not.toBeNull();
      expect(indicators.margenNeto).not.toBeNull();
      expect(indicators.crecimientoIngresos).not.toBeNull();
    }
  });

  it("no repite el mismo patrón de crecimiento en todo el padrón", () => {
    const growth = new Set<string>();
    const byCompany = new Map<string, number[]>();
    for (const row of financials) {
      const list = byCompany.get(row.companyId) ?? [];
      list.push(row.revenue);
      byCompany.set(row.companyId, list);
    }
    for (const revenues of byCompany.values()) {
      if (revenues.length < 2) continue;
      const last = revenues[revenues.length - 1] ?? 0;
      const previous = revenues[revenues.length - 2] ?? 0;
      growth.add(last > previous ? "up" : last < previous ? "down" : "flat");
    }
    expect(growth.has("up")).toBe(true);
    expect(growth.has("down")).toBe(true);
  });
});
