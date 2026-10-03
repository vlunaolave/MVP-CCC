import { differenceInMonths, differenceInYears, format } from "date-fns";
import { es } from "date-fns/locale";

export function dateOnly(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T12:00:00.000Z`);
}

export function isoDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(value: string | Date): string {
  const day = isoDate(value);
  return format(dateOnly(day), "d MMM yyyy", { locale: es });
}

export function formatDisplayDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "d MMM yyyy, HH:mm", { locale: es });
}

export function yearOf(value: string | Date): string {
  return isoDate(value).slice(0, 4);
}

export function monthKey(value: string | Date): string {
  return isoDate(value).slice(0, 7);
}

export function latestMonthStats(values: Array<string | Date>): { etiqueta: string; ultimo: number; delta: number } {
  if (values.length === 0) {
    return { etiqueta: "", ultimo: 0, delta: 0 };
  }
  const keys = values.map((value) => monthKey(value));
  const latest = keys.reduce((max, key) => (key > max ? key : max));
  const [yearText, monthText] = latest.split("-");
  const previousDate = new Date(Date.UTC(Number(yearText), Number(monthText) - 2, 1));
  const previous = `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const ultimo = keys.filter((key) => key === latest).length;
  const anterior = keys.filter((key) => key === previous).length;
  return {
    etiqueta: format(dateOnly(`${latest}-01`), "MMM yyyy", { locale: es }),
    ultimo,
    delta: ultimo - anterior,
  };
}

export function formatAntiguedad(value: string | null, now = new Date()): string | null {
  if (!value) {
    return null;
  }
  const start = dateOnly(isoDate(value));
  const years = differenceInYears(now, start);
  if (years >= 1) {
    return years === 1 ? "1 año" : `${years} años`;
  }
  const months = Math.max(1, differenceInMonths(now, start));
  return months === 1 ? "1 mes" : `${months} meses`;
}

export function greetingFor(nombre: string, now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Bogota",
    }).format(now),
  );
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  return `${saludo}, ${nombre}`;
}

export function inDateRange(value: string, desde?: string, hasta?: string): boolean {
  const day = isoDate(value);
  if (desde && day < desde) {
    return false;
  }
  if (hasta && day > hasta) {
    return false;
  }
  return true;
}
