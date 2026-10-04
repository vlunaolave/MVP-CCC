import { companies } from "./companies";
import type { CompanySeed, FinancialSeed } from "./types";

type Behavior = "crecimiento" | "estable" | "disminucion" | "endeudamiento" | "liquidez";

const BEHAVIORS: Behavior[] = ["crecimiento", "estable", "disminucion", "endeudamiento", "liquidez"];

const EMPTY = new Set(["co-horizonte", "co-faro", "co-semilla", "co-recicladores", "co-horno", "co-cafe", "co-marea", "co-vitrina"]);

const ASSET_TO_REVENUE: Record<CompanySeed["sector"], number> = {
  TECNOLOGIA: 0.92,
  COMERCIO: 0.48,
  CONSTRUCCION: 1.85,
  SERVICIOS: 0.68,
  INDUSTRIA: 1.65,
  TRANSPORTE: 1.42,
  SALUD: 1.12,
};

const OPERATING_MARGIN: Record<CompanySeed["sector"], number> = {
  TECNOLOGIA: 0.16,
  COMERCIO: 0.045,
  CONSTRUCCION: 0.08,
  SERVICIOS: 0.11,
  INDUSTRIA: 0.09,
  TRANSPORTE: 0.07,
  SALUD: 0.1,
};

function hash(value: string): number {
  let result = 0;
  for (const char of value) {
    result = (result * 33 + char.charCodeAt(0)) >>> 0;
  }
  return result;
}

function millions(value: number): number {
  return Math.round(value / 1_000_000) * 1_000_000;
}

function unit(seed: number): number {
  return (seed % 1000) / 1000;
}

function behaviorOf(companyId: string): Behavior {
  return BEHAVIORS[hash(companyId) % BEHAVIORS.length] ?? "estable";
}

function latestRevenue(company: CompanySeed): number {
  const spread = unit(hash(`${company.id}-rev`));
  if (company.tamanoEmpresa === "MICRO") return millions(140_000_000 + spread * 260_000_000);
  if (company.tamanoEmpresa === "PEQUENA") return millions(700_000_000 + spread * 1_600_000_000);
  if (company.tamanoEmpresa === "MEDIANA") return millions(2_800_000_000 + spread * 8_000_000_000);
  return millions(16_000_000_000 + spread * 40_000_000_000);
}

function yearsFor(company: CompanySeed): number[] {
  if (company.id === "co-innova") {
    return [2021, 2022, 2023, 2024, 2025];
  }
  const founded = company.fechaConstitucion ? Number(company.fechaConstitucion.slice(0, 4)) : 2024;
  const start = Math.max(2021, Math.min(Number.isFinite(founded) ? founded : 2024, 2025));
  const years: number[] = [];
  for (let year = start; year <= 2025; year += 1) {
    years.push(year);
  }
  return years.length > 0 ? years : [2025];
}

function revenuePath(latest: number, count: number, behavior: Behavior, salt: number): number[] {
  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 1 : index / (count - 1);
    let factor = 1;
    if (behavior === "crecimiento") factor = 0.58 + 0.42 * progress;
    else if (behavior === "estable") factor = 0.94 + ((index + salt) % 3) * 0.03;
    else if (behavior === "disminucion") factor = 0.72 + 0.4 * Math.sin(progress * Math.PI);
    else if (behavior === "endeudamiento") factor = 0.82 + 0.18 * progress;
    else factor = 0.7 + 0.3 * progress;
    return Math.max(millions(latest * factor), 20_000_000);
  });
}

function statement(
  company: CompanySeed,
  year: number,
  revenue: number,
  employees: number,
  behavior: Behavior,
  index: number,
): FinancialSeed {
  const salt = hash(`${company.id}-${year}`);
  const assetMultiple = ASSET_TO_REVENUE[company.sector] + (unit(salt) - 0.5) * 0.16;
  const totalAssets = millions(revenue * assetMultiple);
  const debtRatio =
    behavior === "endeudamiento" ? 0.72 + unit(salt) * 0.06 : behavior === "liquidez" ? 0.22 + unit(salt) * 0.08 : 0.36 + unit(salt) * 0.16;
  const totalLiabilities = millions(totalAssets * debtRatio);
  const equity = totalAssets - totalLiabilities;
  const currentAssetShare = behavior === "liquidez" ? 0.74 : company.sector === "COMERCIO" ? 0.6 : 0.4 + unit(salt) * 0.12;
  const currentAssets = Math.min(totalAssets, millions(totalAssets * currentAssetShare));
  const currentLiabilityShare = behavior === "liquidez" ? 0.22 : 0.46 + unit(salt) * 0.08;
  const currentLiabilities = Math.min(totalLiabilities, millions(totalLiabilities * currentLiabilityShare));
  const margin = OPERATING_MARGIN[company.sector] * (behavior === "disminucion" && index > 0 ? 0.85 : 1);
  const operatingProfit = millions(revenue * margin);
  const interestRate = behavior === "endeudamiento" ? 0.13 : 0.08 + unit(salt) * 0.03;
  const interestExpense = millions(Math.max(totalLiabilities * interestRate, totalLiabilities > 0 ? 1_000_000 : 0));
  const ebitda = operatingProfit + millions(totalAssets * 0.035);
  const pretax = operatingProfit - interestExpense;
  const tax = pretax > 0 ? millions(pretax * 0.35) : 0;
  const netProfit = pretax - tax;
  return {
    id: `fin-${company.id}-${year}`,
    companyId: company.id,
    year,
    cutoffDate: `${year}-12-31`,
    revenue,
    ebitda,
    operatingProfit,
    interestExpense,
    netProfit,
    totalAssets,
    totalLiabilities,
    equity,
    employees,
    currentAssets,
    currentLiabilities,
  };
}

function employeesAt(company: CompanySeed, index: number, count: number): number {
  const latest = Math.max(1, company.numeroEmpleados ?? 8);
  const stepsBack = count - 1 - index;
  return Math.max(1, latest - stepsBack * Math.max(1, Math.round(latest * 0.06)));
}

export const financials: FinancialSeed[] = companies
  .filter((company) => !EMPTY.has(company.id))
  .flatMap((company) => {
    const years = yearsFor(company);
    const behavior = company.id === "co-innova" ? "crecimiento" : behaviorOf(company.id);
    const latest = company.id === "co-innova" ? 3_970_000_000 : latestRevenue(company);
    const revenues = revenuePath(latest, years.length, behavior, hash(company.id) % 3);
    if (behavior === "disminucion" && revenues.length >= 2) {
      const last = revenues.length - 1;
      const previous = revenues[last - 1] ?? latest;
      revenues[last] = millions(previous * 0.91);
    }
    return years.map((year, index) => statement(company, year, revenues[index] ?? latest, employeesAt(company, index, years.length), behavior, index));
  });
