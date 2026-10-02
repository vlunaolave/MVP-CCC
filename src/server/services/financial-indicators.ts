import type { IndicatorSet } from "@/shared/types/domain";

export interface PeriodAmounts {
  year: number;
  revenue: number;
  ebitda: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  employees: number;
  currentAssets: number | null;
  currentLiabilities: number | null;
}

export const EMPTY_INDICATORS: IndicatorSet = {
  margenNeto: null,
  margenOperativo: null,
  roa: null,
  roe: null,
  razonCorriente: null,
  deudaPatrimonio: null,
  crecimientoIngresos: null,
  crecimientoActivos: null,
};

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
  return {
    margenNeto: ratio(current.netProfit, current.revenue),
    margenOperativo: ratio(current.ebitda, current.revenue),
    roa: ratio(current.netProfit, current.totalAssets),
    roe: ratio(current.netProfit, current.equity),
    razonCorriente:
      current.currentAssets === null || current.currentLiabilities === null
        ? null
        : ratio(current.currentAssets, current.currentLiabilities),
    deudaPatrimonio: ratio(current.totalLiabilities, current.equity),
    crecimientoIngresos: previous ? ratio(current.revenue - previous.revenue, previous.revenue) : null,
    crecimientoActivos: previous ? ratio(current.totalAssets - previous.totalAssets, previous.totalAssets) : null,
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

const oneDecimal = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatPercent(value: number | null, signed = false): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/D";
  }
  const body = `${oneDecimal.format(value * 100)} %`;
  if (signed && value > 0) {
    return `+${body}`;
  }
  return body;
}

export function formatTimes(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/D";
  }
  return oneDecimal.format(value);
}

export function formatVariation(value: number | null, previousYear: number | null): string {
  if (value === null || previousYear === null || !Number.isFinite(value)) {
    return "N/D";
  }
  return `${formatPercent(value, true)} vs ${previousYear}`;
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
