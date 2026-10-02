import type { Prisma, RolCodigo } from "@prisma/client";

import type {
  AdminRole,
  AdminUser,
  AlertItem,
  AppSettingItem,
  CompanyListItem,
  CompanyProfile,
  DashboardPayload,
  GraphPayload,
  MonitoringItem,
} from "@/shared/types/domain";
import type { AlertFilters, CompanyFilters, DashboardFilters, MonitoringFilters } from "@/shared/types/filters";

export interface CompanyRepository {
  search(userId: string, filters: CompanyFilters): Promise<{
    items: CompanyListItem[];
    totalDisponibles: number;
    recientes: CompanyListItem[];
    opciones: {
      municipios: string[];
      actividades: { codigo: string; descripcion: string }[];
    };
  }>;
  findById(id: string, userId: string): Promise<CompanyProfile | null>;
  graph(id: string): Promise<GraphPayload | null>;
}

export interface MonitoringRepository {
  list(userId: string, filters: MonitoringFilters): Promise<MonitoringItem[]>;
  add(userId: string, companyId: string): Promise<"created" | "exists" | "missing">;
  remove(userId: string, companyId: string): Promise<boolean>;
}

export interface AlertRepository {
  search(filters: AlertFilters): Promise<{ items: AlertItem[]; noLeidas: number }>;
  markRead(id: string): Promise<AlertItem | null>;
}

export interface DashboardRepository {
  aggregates(filters: DashboardFilters): Promise<DashboardPayload>;
}

export interface UserRepository {
  list(): Promise<AdminUser[]>;
  create(input: { email: string; nombre: string; passwordHash: string; rol: RolCodigo }): Promise<AdminUser>;
  update(
    id: string,
    input: { nombre?: string; rol?: RolCodigo; activo?: boolean; passwordHash?: string },
  ): Promise<AdminUser | null>;
  findById(id: string): Promise<AdminUser | null>;
  countActiveAdmins(exceptId?: string): Promise<number>;
}

export interface AuditRepository {
  write(entry: {
    userId: string;
    accion: Prisma.AuditLogCreateInput["accion"];
    entidad: string;
    entidadId?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void>;
}

export interface SettingsRepository {
  list(): Promise<AppSettingItem[]>;
  update(clave: string, valor: string): Promise<AppSettingItem | null>;
}

export interface RoleRepository {
  list(): Promise<AdminRole[]>;
}
