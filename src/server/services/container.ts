import bcrypt from "bcryptjs";

import { prisma } from "@/shared/lib/prisma";
import { hasPermission } from "@/shared/lib/permissions";
import type { CompanyProfile, RolCodigo, SessionUser } from "@/shared/types/domain";
import type { AlertFilters, CompanyFilters, DashboardFilters, MonitoringFilters } from "@/shared/types/filters";
import { AppError } from "@/server/errors";
import {
  SqliteAlertRepository,
  SqliteAuditRepository,
  SqliteCompanyRepository,
  SqliteDashboardRepository,
  SqliteMonitoringRepository,
  SqliteRoleRepository,
  SqliteSettingsRepository,
  SqliteUserRepository,
} from "@/server/repositories/sqlite";

const companies = new SqliteCompanyRepository(prisma);
const monitoring = new SqliteMonitoringRepository(prisma);
const alerts = new SqliteAlertRepository(prisma);
const dashboard = new SqliteDashboardRepository(prisma);
const users = new SqliteUserRepository(prisma);
const roles = new SqliteRoleRepository(prisma);
const settings = new SqliteSettingsRepository(prisma);
const audit = new SqliteAuditRepository(prisma);

function redactProfile(profile: CompanyProfile, rol: RolCodigo): CompanyProfile {
  return {
    ...profile,
    relaciones: hasPermission(rol, "empresas.relaciones") ? profile.relaciones : null,
    timeline: hasPermission(rol, "empresas.timeline") ? profile.timeline : null,
    alertas: hasPermission(rol, "alertas.ver") ? profile.alertas : null,
  };
}

export const companyService = {
  search(user: SessionUser, filters: CompanyFilters) {
    return companies.search(user.id, filters);
  },
  async profile(user: SessionUser, id: string) {
    const profile = await companies.findById(id, user.id);
    if (!profile) {
      return null;
    }
    await audit.write({
      userId: user.id,
      accion: "CONSULTA_EMPRESA",
      entidad: "Company",
      entidadId: id,
    });
    return redactProfile(profile, user.rol);
  },
  graph(id: string) {
    return companies.graph(id);
  },
};

export const monitoringService = {
  list(user: SessionUser, filters: MonitoringFilters) {
    return monitoring.list(user.id, filters);
  },
  async add(user: SessionUser, companyId: string) {
    const result = await monitoring.add(user.id, companyId);
    if (result === "missing") {
      throw new AppError("La empresa no existe.", 404, "NOT_FOUND");
    }
    if (result === "created") {
      await audit.write({
        userId: user.id,
        accion: "INICIO_MONITOREO",
        entidad: "MonitoredCompany",
        entidadId: companyId,
      });
    }
    return result;
  },
  async remove(user: SessionUser, companyId: string) {
    const removed = await monitoring.remove(user.id, companyId);
    if (!removed) {
      throw new AppError("La empresa no está en tu monitoreo.", 404, "NOT_FOUND");
    }
    await audit.write({
      userId: user.id,
      accion: "FIN_MONITOREO",
      entidad: "MonitoredCompany",
      entidadId: companyId,
    });
  },
};

export const alertService = {
  search(filters: AlertFilters) {
    return alerts.search(filters);
  },
  async markRead(user: SessionUser, id: string) {
    const alert = await alerts.markRead(id);
    if (!alert) {
      throw new AppError("La alerta no existe.", 404, "NOT_FOUND");
    }
    await audit.write({
      userId: user.id,
      accion: "LECTURA_ALERTA",
      entidad: "Alert",
      entidadId: id,
    });
    return alert;
  },
};

export const dashboardService = {
  aggregates(filters: DashboardFilters) {
    return dashboard.aggregates(filters);
  },
};

export const adminService = {
  users() {
    return users.list();
  },
  roles() {
    return roles.list();
  },
  settings() {
    return settings.list();
  },
  async createUser(actor: SessionUser, input: { email: string; nombre: string; password: string; rol: RolCodigo }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) {
      throw new AppError("Ya existe un usuario con ese correo.", 409, "DUPLICATE");
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const created = await users.create({ ...input, passwordHash });
    await audit.write({
      userId: actor.id,
      accion: "CAMBIO_ADMINISTRATIVO",
      entidad: "User",
      entidadId: created.id,
      metadata: { operacion: "crear", rol: created.rol },
    });
    return created;
  },
  async updateUser(
    actor: SessionUser,
    id: string,
    input: { nombre?: string; rol?: RolCodigo; activo?: boolean; password?: string },
  ) {
    const current = await users.findById(id);
    if (!current) {
      throw new AppError("El usuario no existe.", 404, "NOT_FOUND");
    }
    if (actor.id === id && input.activo === false) {
      throw new AppError("No puedes desactivar tu propia sesión.", 400, "SELF_DEACTIVATE");
    }
    const nextRol = input.rol ?? current.rol;
    const nextActivo = input.activo ?? current.activo;
    const leavesAdminSeat = current.rol === "ADMINISTRADOR" && current.activo && (nextRol !== "ADMINISTRADOR" || !nextActivo);
    if (leavesAdminSeat) {
      const others = await users.countActiveAdmins(id);
      if (others === 0) {
        throw new AppError("Debe quedar al menos un administrador activo.", 400, "LAST_ADMIN");
      }
    }
    const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined;
    const updated = await users.update(id, {
      nombre: input.nombre,
      rol: input.rol,
      activo: input.activo,
      passwordHash,
    });
    await audit.write({
      userId: actor.id,
      accion: "CAMBIO_ADMINISTRATIVO",
      entidad: "User",
      entidadId: id,
      metadata: { operacion: "actualizar", rol: nextRol, activo: nextActivo },
    });
    return updated;
  },
  async updateSetting(actor: SessionUser, clave: string, valor: string) {
    const updated = await settings.update(clave, valor);
    if (!updated) {
      throw new AppError("La configuración no existe.", 404, "NOT_FOUND");
    }
    await audit.write({
      userId: actor.id,
      accion: "CAMBIO_ADMINISTRATIVO",
      entidad: "AppSetting",
      entidadId: clave,
      metadata: { clave },
    });
    return updated;
  },
};

export const auditService = audit;
