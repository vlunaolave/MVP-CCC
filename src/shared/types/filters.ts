import type {
  EstadoMatricula,
  SectorCodigo,
  Severidad,
  SortDir,
  SortKey,
  TamanoEmpresa,
  TipoEvento,
  TipoRegistro,
} from "@/shared/types/domain";

export interface CompanyFilters {
  q?: string;
  tipoRegistro?: TipoRegistro;
  estadoMatricula?: EstadoMatricula;
  municipio?: string;
  departamento?: string;
  actividad?: string;
  tamanoEmpresa?: TamanoEmpresa;
  sector?: SectorCodigo;
  empleadosMin?: number;
  empleadosMax?: number;
  ingresosMin?: number;
  ingresosMax?: number;
  activosMin?: number;
  activosMax?: number;
  monitoreada?: boolean;
  sort?: SortKey;
  dir?: SortDir;
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
  departamento?: string;
  estadoMatricula?: EstadoMatricula;
  sector?: SectorCodigo;
  tamanoEmpresa?: TamanoEmpresa;
}
