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
