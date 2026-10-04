const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

function isAmount(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value);
}

export function formatCOP(value: number | null | undefined, empty = "N/D"): string {
  if (!isAmount(value)) {
    return empty;
  }
  return cop.format(value).replace(/^\$\s?/, "$ ");
}

export function formatCOPCompact(value: number | null | undefined, empty = "N/D"): string {
  if (!isAmount(value)) {
    return empty;
  }
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${sign}$ ${compactAmount(abs / 1_000_000_000)} mil M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$ ${compactAmount(abs / 1_000_000)} M`;
  }
  return formatCOP(value, empty);
}

function compactAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const tenths = Math.round(rounded * 10) / 10;
  const digits = Math.abs(rounded - Math.round(rounded)) < 0.001 ? 0 : Math.abs(rounded - tenths) < 0.001 ? 1 : 2;
  return new Intl.NumberFormat("es-CO", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(rounded);
}

export function formatPercentage(value: number | null | undefined, signed = false): string {
  if (!isAmount(value)) {
    return "N/D";
  }
  const body = `${decimal.format(value * 100)} %`;
  if (signed && value > 0) {
    return `+${body}`;
  }
  return body;
}

export function formatNumber(value: number | null | undefined, empty = "N/D"): string {
  if (!isAmount(value)) {
    return empty;
  }
  return integer.format(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "N/D";
  }
  const iso = typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day || year.length !== 4) {
    return "N/D";
  }
  return `${day}/${month}/${year}`;
}

export function formatTimes(value: number | null | undefined): string {
  if (!isAmount(value)) {
    return "N/D";
  }
  return `${decimal.format(value)}x`;
}

export function formatVariation(value: number | null | undefined, previousYear: number | null): string {
  if (!isAmount(value) || previousYear === null) {
    return "N/D";
  }
  return `${formatPercentage(value, true)} vs ${previousYear}`;
}
