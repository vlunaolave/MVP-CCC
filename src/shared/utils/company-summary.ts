import type { EstadoMatricula, TamanoEmpresa } from "@/shared/types/domain";
import { isoDate } from "@/shared/utils/dates";
import { ESTADO_MATRICULA_LABEL, TAMANO_LABEL } from "@/shared/utils/labels";

export interface SummaryInput {
  estadoMatricula: EstadoMatricula | null;
  fechaRenovacion: string | null;
  fechaConstitucion: string | null;
  tipoOrganizacion: string | null;
  actividadEconomicaCodigo: string | null;
  municipio: string | null;
  tamanoEmpresa: TamanoEmpresa | null;
  numeroEmpleados: number | null;
}

export function buildCompanySummary(company: SummaryInput): string {
  const phrases: string[] = [];
  if (company.estadoMatricula) {
    phrases.push(`matrícula ${ESTADO_MATRICULA_LABEL[company.estadoMatricula].toLowerCase()}`);
  }
  if (company.fechaRenovacion) {
    phrases.push(`renovada en ${isoDate(company.fechaRenovacion).slice(0, 4)}`);
  }
  if (company.fechaConstitucion) {
    phrases.push(`antigüedad desde ${isoDate(company.fechaConstitucion)}`);
  }
  if (company.tipoOrganizacion) {
    phrases.push(company.tipoOrganizacion);
  }
  if (company.actividadEconomicaCodigo) {
    phrases.push(`CIIU ${company.actividadEconomicaCodigo}`);
  }
  if (company.municipio) {
    phrases.push(company.municipio);
  }
  if (company.tamanoEmpresa) {
    phrases.push(TAMANO_LABEL[company.tamanoEmpresa].toLowerCase());
  }
  if (company.numeroEmpleados !== null) {
    phrases.push(`${company.numeroEmpleados} empleados`);
  }
  if (phrases.length === 0) {
    return "No hay datos suficientes para armar el resumen.";
  }
  const [first, ...rest] = phrases;
  const head = first ? first.charAt(0).toUpperCase() + first.slice(1) : "";
  return `${head}${rest.length > 0 ? `, ${rest.join(", ")}` : ""}.`;
}
