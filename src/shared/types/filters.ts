import type { EstadoMatricula, Severidad, TamanoEmpresa, TipoEvento, TipoRegistro } from "@/shared/types/domain";

export interface CompanyFilters {
  q?: string;
  tipoRegistro?: TipoRegistro;
  estadoMatricula?: EstadoMatricula;
  municipio?: string;
  actividad?: string;
  tamanoEmpresa?: TamanoEmpresa;
}

export interface AlertFilters {
  desde?: string;
  hasta?: string;
  companyId?: string;
  q?: string;
  tipo?: TipoEvento;
  severidad?: Severidad;
  leida?: boolean;
}

export interface MonitoringFilters {
  q?: string;
  estadoMatricula?: EstadoMatricula;
}

export interface DashboardFilters {
  desde?: string;
  hasta?: string;
  tipoRegistro?: TipoRegistro;
  municipio?: string;
  estadoMatricula?: EstadoMatricula;
}
