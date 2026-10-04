import { formatCOP, formatPercentage, formatTimes, formatVariation } from "@/shared/utils/format";
import type { IndicatorSet } from "@/shared/types/domain";

export { formatPercentage as formatPercent, formatTimes, formatVariation };

export interface PeriodAmounts {
  year: number;
  cutoffDate: string;
  revenue: number;
  ebitda: number;
  operatingProfit: number;
  interestExpense: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  employees: number;
  currentAssets: number | null;
  currentLiabilities: number | null;
  fuenteDatos: string;
}

export const EMPTY_INDICATORS: IndicatorSet = {
  margenNeto: null,
  margenOperativo: null,
  roa: null,
  roe: null,
  razonCorriente: null,
  capitalTrabajo: null,
  nivelEndeudamiento: null,
  deudaPatrimonio: null,
  coberturaIntereses: null,
  crecimientoIngresos: null,
  crecimientoActivos: null,
  crecimientoPatrimonio: null,
};

export const FUENTE_DEMO = "Datos de demostración MVP";

export function ratio(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : null;
}

export function sortPeriods(periods: PeriodAmounts[]): PeriodAmounts[] {
  return [...periods].sort((a, b) => a.year - b.year);
}

export function indicatorsBetween(current: PeriodAmounts, previous: PeriodAmounts | null): IndicatorSet {
  const capitalTrabajo =
    current.currentAssets === null || current.currentLiabilities === null
      ? null
      : current.currentAssets - current.currentLiabilities;
  return {
    margenNeto: ratio(current.netProfit, current.revenue),
    margenOperativo: ratio(current.operatingProfit, current.revenue),
    roa: ratio(current.netProfit, current.totalAssets),
    roe: ratio(current.netProfit, current.equity),
    razonCorriente:
      current.currentAssets === null || current.currentLiabilities === null
        ? null
        : ratio(current.currentAssets, current.currentLiabilities),
    capitalTrabajo: capitalTrabajo !== null && Number.isFinite(capitalTrabajo) ? capitalTrabajo : null,
    nivelEndeudamiento: ratio(current.totalLiabilities, current.totalAssets),
    deudaPatrimonio: ratio(current.totalLiabilities, current.equity),
    coberturaIntereses: ratio(current.operatingProfit, current.interestExpense),
    crecimientoIngresos: previous ? ratio(current.revenue - previous.revenue, previous.revenue) : null,
    crecimientoActivos: previous ? ratio(current.totalAssets - previous.totalAssets, previous.totalAssets) : null,
    crecimientoPatrimonio: previous ? ratio(current.equity - previous.equity, previous.equity) : null,
  };
}

export function indicatorsFor(periods: PeriodAmounts[]): IndicatorSet {
  const sorted = sortPeriods(periods);
  const current = sorted[sorted.length - 1];
  if (!current) {
    return EMPTY_INDICATORS;
  }
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] ?? null : null;
  return indicatorsBetween(current, previous);
}

export function indicatorsByYear(periods: PeriodAmounts[]): Map<number, IndicatorSet> {
  const sorted = sortPeriods(periods);
  const map = new Map<number, IndicatorSet>();
  sorted.forEach((period, index) => {
    const previous = index > 0 ? sorted[index - 1] ?? null : null;
    map.set(period.year, indicatorsBetween(period, previous));
  });
  return map;
}

export function difference(company: number | null, average: number | null): { absoluta: number | null; porcentual: number | null } {
  if (company === null || average === null || !Number.isFinite(company) || !Number.isFinite(average)) {
    return { absoluta: null, porcentual: null };
  }
  const absoluta = company - average;
  return {
    absoluta: Number.isFinite(absoluta) ? absoluta : null,
    porcentual: ratio(absoluta, average),
  };
}

export type IndicatorGroup = "Liquidez" | "Endeudamiento" | "Rentabilidad" | "Cobertura" | "Crecimiento";

export interface IndicatorView {
  id: string;
  grupo: IndicatorGroup;
  nombre: string;
  valor: string;
  explicacion: string;
  variacion: string | null;
}

function change(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) {
    return null;
  }
  return ratio(current - previous, Math.abs(previous));
}

function explainRatio(value: number | null, text: (formatted: string) => string): string {
  if (value === null) {
    return "No hay datos suficientes para calcular este indicador.";
  }
  return text(formatTimes(value).replace("x", ""));
}

export function indicatorViews(current: IndicatorSet, previous: IndicatorSet | null, previousYear: number | null): IndicatorView[] {
  const variation = (value: number | null, prior: number | null) => {
    const delta = change(value, prior);
    if (delta === null || previousYear === null) {
      return null;
    }
    return formatVariation(delta, previousYear);
  };

  return [
    {
      id: "razonCorriente",
      grupo: "Liquidez",
      nombre: "Razón corriente",
      valor: formatTimes(current.razonCorriente),
      explicacion: explainRatio(
        current.razonCorriente,
        (formatted) => `La empresa dispone de ${formatted} de activo corriente por cada $1 de obligación corriente.`,
      ),
      variacion: variation(current.razonCorriente, previous?.razonCorriente ?? null),
    },
    {
      id: "capitalTrabajo",
      grupo: "Liquidez",
      nombre: "Capital de trabajo",
      valor: formatCOP(current.capitalTrabajo),
      explicacion:
        current.capitalTrabajo === null
          ? "No hay datos suficientes para calcular este indicador."
          : `Activo corriente menos pasivo corriente: ${formatCOP(current.capitalTrabajo)}.`,
      variacion: variation(current.capitalTrabajo, previous?.capitalTrabajo ?? null),
    },
    {
      id: "nivelEndeudamiento",
      grupo: "Endeudamiento",
      nombre: "Nivel de endeudamiento",
      valor: formatPercentage(current.nivelEndeudamiento),
      explicacion:
        current.nivelEndeudamiento === null
          ? "No hay datos suficientes para calcular este indicador."
          : `El pasivo total equivale al ${formatPercentage(current.nivelEndeudamiento)} del activo total.`,
      variacion: variation(current.nivelEndeudamiento, previous?.nivelEndeudamiento ?? null),
    },
    {
      id: "deudaPatrimonio",
      grupo: "Endeudamiento",
      nombre: "Deuda / patrimonio",
      valor: formatTimes(current.deudaPatrimonio),
      explicacion: explainRatio(
        current.deudaPatrimonio,
        (formatted) => `Hay ${formatted} de pasivo total por cada $1 de patrimonio.`,
      ),
      variacion: variation(current.deudaPatrimonio, previous?.deudaPatrimonio ?? null),
    },
    {
      id: "margenOperativo",
      grupo: "Rentabilidad",
      nombre: "Margen operacional",
      valor: formatPercentage(current.margenOperativo),
      explicacion:
        current.margenOperativo === null
          ? "No hay datos suficientes para calcular este indicador."
          : `La utilidad operacional representa el ${formatPercentage(current.margenOperativo)} de los ingresos.`,
      variacion: variation(current.margenOperativo, previous?.margenOperativo ?? null),
    },
    {
      id: "margenNeto",
      grupo: "Rentabilidad",
      nombre: "Margen neto",
      valor: formatPercentage(current.margenNeto),
      explicacion:
        current.margenNeto === null
          ? "No hay datos suficientes para calcular este indicador."
          : `La utilidad neta representa el ${formatPercentage(current.margenNeto)} de los ingresos.`,
      variacion: variation(current.margenNeto, previous?.margenNeto ?? null),
    },
    {
      id: "roa",
      grupo: "Rentabilidad",
      nombre: "ROA",
      valor: formatPercentage(current.roa),
      explicacion:
        current.roa === null
          ? "No hay datos suficientes para calcular este indicador."
          : `La utilidad neta equivale al ${formatPercentage(current.roa)} del activo total.`,
      variacion: variation(current.roa, previous?.roa ?? null),
    },
    {
      id: "roe",
      grupo: "Rentabilidad",
      nombre: "ROE",
      valor: formatPercentage(current.roe),
      explicacion:
        current.roe === null
          ? "No hay datos suficientes para calcular este indicador."
          : `La utilidad neta equivale al ${formatPercentage(current.roe)} del patrimonio.`,
      variacion: variation(current.roe, previous?.roe ?? null),
    },
    {
      id: "coberturaIntereses",
      grupo: "Cobertura",
      nombre: "Cobertura de intereses",
      valor: formatTimes(current.coberturaIntereses),
      explicacion: explainRatio(
        current.coberturaIntereses,
        (formatted) => `La utilidad operacional cubre ${formatted} veces los gastos de interés.`,
      ),
      variacion: variation(current.coberturaIntereses, previous?.coberturaIntereses ?? null),
    },
    {
      id: "crecimientoIngresos",
      grupo: "Crecimiento",
      nombre: "Crecimiento de ingresos",
      valor: formatPercentage(current.crecimientoIngresos, true),
      explicacion:
        current.crecimientoIngresos === null
          ? "Se necesita el periodo anterior para medir el crecimiento."
          : `Los ingresos variaron ${formatPercentage(current.crecimientoIngresos, true)} frente al periodo anterior.`,
      variacion: null,
    },
    {
      id: "crecimientoActivos",
      grupo: "Crecimiento",
      nombre: "Crecimiento de activos",
      valor: formatPercentage(current.crecimientoActivos, true),
      explicacion:
        current.crecimientoActivos === null
          ? "Se necesita el periodo anterior para medir el crecimiento."
          : `Los activos variaron ${formatPercentage(current.crecimientoActivos, true)} frente al periodo anterior.`,
      variacion: null,
    },
    {
      id: "crecimientoPatrimonio",
      grupo: "Crecimiento",
      nombre: "Crecimiento del patrimonio",
      valor: formatPercentage(current.crecimientoPatrimonio, true),
      explicacion:
        current.crecimientoPatrimonio === null
          ? "Se necesita el periodo anterior para medir el crecimiento."
          : `El patrimonio varió ${formatPercentage(current.crecimientoPatrimonio, true)} frente al periodo anterior.`,
      variacion: null,
    },
  ];
}
