import { companies } from "./companies";
import type { FinancialSeed } from "./types";

const innova: FinancialSeed[] = [
  row("co-innova", 2021, 2100000000, 320000000, 180000000, 980000000, 410000000, 570000000, 28, 420000000, 210000000),
  row("co-innova", 2022, 2600000000, 410000000, 240000000, 1200000000, 480000000, 720000000, 33, 510000000, 240000000),
  row("co-innova", 2023, 3100000000, 520000000, 310000000, 1450000000, 520000000, 930000000, 39, 640000000, 260000000),
  row("co-innova", 2024, 3700000000, 640000000, 390000000, 1720000000, 590000000, 1130000000, 44, 760000000, 300000000),
  row("co-innova", 2025, 4200000000, 760000000, 470000000, 1980000000, 640000000, 1340000000, 48, 890000000, 320000000),
];

const series: Record<string, number[]> = {
  "co-mercado": [980000000, 1120000000, 1290000000, 1480000000],
  "co-ladrillo": [5400000000, 5900000000, 6400000000, 7050000000],
  "co-punto": [410000000, 470000000, 530000000, 610000000],
  "co-metal": [8600000000, 9400000000, 10300000000, 11250000000],
  "co-andes": [2100000000, 2360000000, 2640000000, 2980000000],
  "co-bienestar": [1540000000, 1710000000, 1890000000, 2120000000],
  "co-andina-soft": [2680000000, 3010000000, 3380000000, 3800000000],
  "co-codigo-sur": [3250000000, 3650000000, 4100000000, 4600000000],
  "co-nodo-cali": [2160000000, 2440000000, 2750000000, 3100000000],
};

const mix: Record<string, [number, number, number, number]> = {
  "co-mercado": [0.08, 0.04, 0.46, 0.41],
  "co-ladrillo": [0.14, 0.07, 0.72, 0.46],
  "co-punto": [0.18, 0.09, 0.4, 0.33],
  "co-metal": [0.17, 0.08, 0.81, 0.44],
  "co-andes": [0.13, 0.06, 0.58, 0.39],
  "co-bienestar": [0.15, 0.07, 0.63, 0.36],
  "co-andina-soft": [0.19, 0.11, 0.48, 0.34],
  "co-codigo-sur": [0.18, 0.1, 0.51, 0.37],
  "co-nodo-cali": [0.145, 0.084, 0.52, 0.44],
};

const empty = new Set([
  "co-horizonte",
  "co-faro",
  "co-semilla",
  "co-recicladores",
  "co-horno",
  "co-cafe",
  "co-marea",
  "co-vitrina",
]);

function row(
  companyId: string,
  year: number,
  revenue: number,
  ebitda: number,
  netProfit: number,
  totalAssets: number,
  totalLiabilities: number,
  equity: number,
  employees: number,
  currentAssets: number,
  currentLiabilities: number,
): FinancialSeed {
  return {
    id: `fin-${companyId}-${year}`,
    companyId,
    year,
    revenue,
    ebitda,
    netProfit,
    totalAssets,
    totalLiabilities,
    equity,
    employees,
    currentAssets,
    currentLiabilities,
  };
}

function fromMix(companyId: string, year: number, revenue: number, employees: number): FinancialSeed {
  const [ebitdaRate, netRate, assetRate, liabilityRate] = mix[companyId] ?? [0.16, 0.08, 0.5, 0.4];
  const ebitda = Math.round(revenue * ebitdaRate);
  const netProfit = Math.round(revenue * netRate);
  const totalAssets = Math.round(revenue * assetRate);
  const totalLiabilities = Math.round(totalAssets * liabilityRate);
  const equity = totalAssets - totalLiabilities;
  return row(
    companyId,
    year,
    revenue,
    ebitda,
    netProfit,
    totalAssets,
    totalLiabilities,
    equity,
    employees,
    Math.round(totalAssets * 0.41),
    Math.round(totalLiabilities * 0.47),
  );
}

const headcount = new Map(companies.map((company) => [company.id, company.numeroEmpleados ?? 8]));

function staff(companyId: string, indexFromEnd: number): number {
  return Math.max(1, (headcount.get(companyId) ?? 8) - indexFromEnd * 3);
}

const multiYear: FinancialSeed[] = Object.entries(series).flatMap(([companyId, revenues]) =>
  revenues.map((revenue, index) => fromMix(companyId, 2022 + index, revenue, staff(companyId, revenues.length - 1 - index))),
);

const labs: FinancialSeed[] = [
  fromMix("co-innova-labs", 2024, 620000000, 11),
  fromMix("co-innova-labs", 2025, 780000000, 14),
];

const covered = new Set<string>([
  "co-innova",
  "co-innova-labs",
  ...Object.keys(series),
  ...empty,
]);

const singleYear: FinancialSeed[] = companies
  .filter((company) => !covered.has(company.id))
  .map((company, index) => fromMix(company.id, 2025, 125000000 + index * 43000000, company.numeroEmpleados ?? 8));

export const financials: FinancialSeed[] = [...innova, ...multiYear, ...labs, ...singleYear];
