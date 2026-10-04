import { describe, expect, it } from "vitest";

import { RulesAnalysisProvider } from "@/server/services/analysis-provider";
import { alertRuleEvaluator, snapshotFromPeriods } from "@/server/services/alert-rule-evaluator";
import type { PeriodAmounts } from "@/server/services/financial-indicators";

function period(year: number, revenue: number, assets: number, liabilities: number, currentAssets: number, currentLiabilities: number): PeriodAmounts {
  return {
    year,
    cutoffDate: `${year}-12-31`,
    revenue,
    ebitda: revenue * 0.1,
    operatingProfit: revenue * 0.08,
    interestExpense: liabilities * 0.1,
    netProfit: revenue * 0.04,
    totalAssets: assets,
    totalLiabilities: liabilities,
    equity: assets - liabilities,
    employees: 10,
    currentAssets,
    currentLiabilities,
    fuenteDatos: "DEMO",
  };
}

describe("AlertRuleEvaluator", () => {
  it("activa endeudamiento mayor que 70 % y no lo hace por debajo", () => {
    const high = snapshotFromPeriods("a", "Alta Deuda", [period(2025, 100, 100, 80, 40, 20)]);
    const low = snapshotFromPeriods("b", "Baja Deuda", [period(2025, 100, 100, 40, 50, 20)]);
    const rule = {
      id: "r",
      nombre: "Endeudamiento alto",
      categoria: "FINANCIERA" as const,
      campoObservado: "nivelEndeudamiento",
      condicion: "MAYOR_QUE" as const,
      valorReferencia: "0.7",
      severidad: "IMPORTANTE" as const,
      tipoEvento: "INDICADOR",
    };
    expect(alertRuleEvaluator.evaluate(rule, high).cumple).toBe(true);
    expect(alertRuleEvaluator.evaluate(rule, low).cumple).toBe(false);
    expect(alertRuleEvaluator.evaluate(rule, high).mensaje).toContain("se activaría");
    expect(alertRuleEvaluator.evaluate(rule, low).mensaje).toContain("no cumple");
  });

  it("detecta una caída de ingresos mayor al 15 %", () => {
    const snapshot = snapshotFromPeriods("c", "Caída", [
      period(2024, 1000, 800, 200, 300, 100),
      period(2025, 800, 800, 200, 300, 100),
    ]);
    const result = alertRuleEvaluator.evaluate(
      {
        id: "r2",
        nombre: "Caída",
        categoria: "FINANCIERA",
        campoObservado: "ingresos",
        condicion: "VARIACION_MENOR",
        valorReferencia: "-15",
        severidad: "IMPORTANTE",
        tipoEvento: "INDICADOR",
      },
      snapshot,
    );
    expect(result.cumple).toBe(true);
  });
});

describe("análisis por reglas", () => {
  it("menciona la alerta presente y no inventa una predicción", async () => {
    const analysis = await new RulesAnalysisProvider().analyze({
      razonSocial: "INNOVA VALLE S.A.S.",
      periodos: 5,
      crecimientoIngresos: 0.12,
      crecimientoIngresosPrevio: 0.08,
      crecimientoPatrimonio: 0.1,
      liquidez: 2,
      liquidezPrevia: 1.9,
      endeudamiento: 0.72,
      endeudamientoPrevio: 0.6,
      alertas: ["Endeudamiento alto"],
      cambios: ["Cambio de representante legal"],
      relaciones: 4,
      sector: "Tecnología",
      comparacionSector: "Los ingresos del último periodo están por encima del promedio de Tecnología disponible en la plataforma.",
    });
    expect(analysis.aviso).toContain("información disponible");
    expect(analysis.monitorear.join(" ")).toContain("Endeudamiento alto");
    expect(analysis.resumen.toLowerCase()).not.toContain("invertir");
    expect(analysis.resumen.toLowerCase()).not.toContain("predicc");
  });
});
