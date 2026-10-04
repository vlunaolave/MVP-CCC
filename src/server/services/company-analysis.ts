import type { PrismaClient } from "@prisma/client";

import { analysisProvider, type CompanyAnalysis } from "@/server/services/analysis-provider";
import { indicatorsBetween, sortPeriods, type PeriodAmounts } from "@/server/services/financial-indicators";
import { AppError } from "@/server/errors";
import { SECTOR_LABEL } from "@/shared/utils/labels";

function money(value: { toString(): string } | null): number | null {
  if (value === null) return null;
  const number = Number(value.toString());
  return Number.isFinite(number) ? number : null;
}

export async function buildCompanyAnalysis(db: PrismaClient, companyId: string, includeAlerts: boolean): Promise<CompanyAnalysis> {
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      periodos: true,
      eventos: { orderBy: { fecha: "desc" }, take: 5 },
      alertas: { orderBy: { fecha: "desc" }, take: 8 },
      relaciones: true,
    },
  });
  if (!company) throw new AppError("La empresa no existe.", 404, "NOT_FOUND");
  const periods = sortPeriods(
    company.periodos.map((period) => ({
      year: period.year,
      cutoffDate: period.cutoffDate.toISOString().slice(0, 10),
      revenue: money(period.revenue) ?? 0,
      ebitda: money(period.ebitda) ?? 0,
      operatingProfit: money(period.operatingProfit) ?? 0,
      interestExpense: money(period.interestExpense) ?? 0,
      netProfit: money(period.netProfit) ?? 0,
      totalAssets: money(period.totalAssets) ?? 0,
      totalLiabilities: money(period.totalLiabilities) ?? 0,
      equity: money(period.equity) ?? 0,
      employees: period.employees,
      currentAssets: money(period.currentAssets),
      currentLiabilities: money(period.currentLiabilities),
      fuenteDatos: period.fuenteDatos,
    }) satisfies PeriodAmounts),
  );
  const current = periods.at(-1) ?? null;
  const previous = periods.length >= 2 ? periods.at(-2) ?? null : null;
  const older = periods.length >= 3 ? periods.at(-3) ?? null : null;
  const currentIndicators = current ? indicatorsBetween(current, previous) : null;
  const previousIndicators = previous ? indicatorsBetween(previous, older) : null;
  const benchmark = current
    ? await db.sectorBenchmark.findFirst({ where: { sector: company.sector, year: { lte: current.year } }, orderBy: { year: "desc" } })
    : null;
  let comparacionSector: string | null = null;
  if (current && benchmark) {
    const avg = money(benchmark.avgRevenue);
    if (avg && avg > 0) {
      comparacionSector = current.revenue >= avg
        ? `Los ingresos del último periodo están por encima del promedio de ${SECTOR_LABEL[company.sector]} disponible en la plataforma.`
        : `Los ingresos del último periodo están por debajo del promedio de ${SECTOR_LABEL[company.sector]} disponible en la plataforma.`;
    }
  }
  return analysisProvider().analyze({
    razonSocial: company.razonSocial,
    periodos: periods.length,
    crecimientoIngresos: currentIndicators?.crecimientoIngresos ?? null,
    crecimientoIngresosPrevio: previousIndicators?.crecimientoIngresos ?? null,
    crecimientoPatrimonio: currentIndicators?.crecimientoPatrimonio ?? null,
    liquidez: currentIndicators?.razonCorriente ?? null,
    liquidezPrevia: previousIndicators?.razonCorriente ?? null,
    endeudamiento: currentIndicators?.nivelEndeudamiento ?? null,
    endeudamientoPrevio: previousIndicators?.nivelEndeudamiento ?? null,
    alertas: includeAlerts ? company.alertas.map((alert) => alert.titulo) : [],
    cambios: company.eventos.map((event) => event.titulo),
    relaciones: company.relaciones.length,
    sector: SECTOR_LABEL[company.sector],
    comparacionSector,
  });
}
