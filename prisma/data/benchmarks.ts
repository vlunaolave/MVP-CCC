import type { BenchmarkSeed, CompanySeed } from "./types";

type Sector = CompanySeed["sector"];

interface YearSeed {
  revenue: number;
  ebitda: number;
  net: number;
  assets: number;
  liabilities: number;
  equity: number;
  employees: number;
  revenueGrowth: number;
  assetGrowth: number;
}

function walk(latest: YearSeed, steps: number[]): YearSeed[] {
  const years: YearSeed[] = [latest];
  let current = latest;
  for (const growth of steps) {
    const previous: YearSeed = {
      revenue: Math.round(current.revenue / (1 + growth)),
      ebitda: Math.round(current.ebitda / (1 + growth)),
      net: Math.round(current.net / (1 + growth)),
      assets: Math.round(current.assets / (1 + current.assetGrowth)),
      liabilities: Math.round(current.liabilities / (1 + current.assetGrowth)),
      equity: 0,
      employees: Math.max(1, Math.round(current.employees / 1.06)),
      revenueGrowth: growth,
      assetGrowth: current.assetGrowth,
    };
    previous.equity = previous.assets - previous.liabilities;
    years.unshift(previous);
    current = { ...previous, assetGrowth: 0.06 };
  }
  return years;
}

const tech2025: YearSeed = {
  revenue: 3100000000,
  ebitda: 480000000,
  net: 290000000,
  assets: 1500000000,
  liabilities: 600000000,
  equity: 900000000,
  employees: 36,
  revenueGrowth: 0.09,
  assetGrowth: 0.07,
};

const latest: Record<Sector, YearSeed> = {
  TECNOLOGIA: tech2025,
  COMERCIO: {
    revenue: 4700000000,
    ebitda: 390000000,
    net: 210000000,
    assets: 2100000000,
    liabilities: 980000000,
    equity: 1120000000,
    employees: 42,
    revenueGrowth: 0.08,
    assetGrowth: 0.06,
  },
  CONSTRUCCION: {
    revenue: 6300000000,
    ebitda: 820000000,
    net: 410000000,
    assets: 4800000000,
    liabilities: 2300000000,
    equity: 2500000000,
    employees: 78,
    revenueGrowth: 0.07,
    assetGrowth: 0.05,
  },
  SERVICIOS: {
    revenue: 1850000000,
    ebitda: 310000000,
    net: 160000000,
    assets: 920000000,
    liabilities: 340000000,
    equity: 580000000,
    employees: 24,
    revenueGrowth: 0.1,
    assetGrowth: 0.06,
  },
  INDUSTRIA: {
    revenue: 7200000000,
    ebitda: 1150000000,
    net: 640000000,
    assets: 6100000000,
    liabilities: 2700000000,
    equity: 3400000000,
    employees: 120,
    revenueGrowth: 0.06,
    assetGrowth: 0.05,
  },
  TRANSPORTE: {
    revenue: 3900000000,
    ebitda: 520000000,
    net: 250000000,
    assets: 2600000000,
    liabilities: 1400000000,
    equity: 1200000000,
    employees: 55,
    revenueGrowth: 0.08,
    assetGrowth: 0.06,
  },
  SALUD: {
    revenue: 2800000000,
    ebitda: 430000000,
    net: 190000000,
    assets: 1900000000,
    liabilities: 760000000,
    equity: 1140000000,
    employees: 64,
    revenueGrowth: 0.09,
    assetGrowth: 0.07,
  },
};

function rowsFor(sector: Sector): BenchmarkSeed[] {
  const chain =
    sector === "TECNOLOGIA"
      ? walk(latest.TECNOLOGIA, [0.08, 0.075, 0.07])
      : walk(latest[sector], [latest[sector].revenueGrowth, latest[sector].revenueGrowth, latest[sector].revenueGrowth]);
  return chain.map((item, index) => ({
    sector,
    year: 2022 + index,
    avgRevenue: item.revenue,
    avgEbitda: item.ebitda,
    avgNetProfit: item.net,
    avgAssets: item.assets,
    avgLiabilities: item.liabilities,
    avgEquity: item.equity,
    avgEmployees: item.employees,
    avgRevenueGrowth: index === chain.length - 1 ? latest[sector].revenueGrowth : item.revenueGrowth,
    avgAssetGrowth: index === chain.length - 1 ? latest[sector].assetGrowth : item.assetGrowth,
  }));
}

export const benchmarks: BenchmarkSeed[] = (
  ["TECNOLOGIA", "COMERCIO", "CONSTRUCCION", "SERVICIOS", "INDUSTRIA", "TRANSPORTE", "SALUD"] as const
).flatMap(rowsFor);

const tech = benchmarks.find((item) => item.sector === "TECNOLOGIA" && item.year === 2025);
if (
  !tech ||
  tech.avgRevenue !== 3100000000 ||
  tech.avgEbitda !== 480000000 ||
  tech.avgNetProfit !== 290000000 ||
  tech.avgAssets !== 1500000000 ||
  tech.avgLiabilities !== 600000000 ||
  tech.avgEquity !== 900000000 ||
  tech.avgEmployees !== 36 ||
  tech.avgRevenueGrowth !== 0.09 ||
  tech.avgAssetGrowth !== 0.07
) {
  throw new Error("El benchmark de Tecnología 2025 no coincide con la referencia.");
}

for (const sector of ["TECNOLOGIA", "COMERCIO", "CONSTRUCCION", "SERVICIOS", "INDUSTRIA", "TRANSPORTE", "SALUD"] as const) {
  const years = benchmarks.filter((item) => item.sector === sector).sort((a, b) => a.year - b.year);
  for (let index = 1; index < years.length; index += 1) {
    const previous = years[index - 1];
    const current = years[index];
    if (!previous || !current || current.avgRevenue < previous.avgRevenue * 0.7) {
      throw new Error(`Ingresos de benchmark incoherentes en ${sector} ${current?.year}`);
    }
  }
}
