import bcrypt from "bcryptjs";

import { prisma } from "@/shared/lib/prisma";
import { hasPermission } from "@/shared/lib/permissions";
import type { CompanyProfile, RolCodigo, SectorCodigo, SessionUser } from "@/shared/types/domain";
import type { AlertFilters, CompanyFilters, DashboardFilters, MonitoringFilters } from "@/shared/types/filters";
import { AppError } from "@/server/errors";
import { assertRule, previewRule, syncRuleAlerts, type RuleInput } from "@/server/services/alert-rule-sync";
import { buildCompanyAnalysis } from "@/server/services/company-analysis";
import { categoryLabel, fieldById, operatorLabel } from "@/shared/utils/alert-rule-catalog";
import {
  SqliteAlertRepository,
  SqliteAuditRepository,
  SqliteCompanyRepository,
  SqliteDashboardRepository,
  SqliteMonitoringRepository,
  SqliteRoleRepository,
  SqliteSavedSearchRepository,
  SqliteSettingsRepository,
  SqliteUserRepository,
  SqliteWatchlistRepository,
} from "@/server/repositories/sqlite";

const companies = new SqliteCompanyRepository(prisma);
const monitoring = new SqliteMonitoringRepository(prisma);
const alerts = new SqliteAlertRepository(prisma);
const dashboard = new SqliteDashboardRepository(prisma);
const users = new SqliteUserRepository(prisma);
const roles = new SqliteRoleRepository(prisma);
const settings = new SqliteSettingsRepository(prisma);
const audit = new SqliteAuditRepository(prisma);
const watchlists = new SqliteWatchlistRepository(prisma);
const savedSearches = new SqliteSavedSearchRepository(prisma);

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
  async analysis(user: SessionUser, id: string) {
    return buildCompanyAnalysis(prisma, id, hasPermission(user.rol, "alertas.ver"));
  },
  async finances(id: string) {
    const payload = await companies.finances(id);
    if (!payload) {
      throw new AppError("La empresa no existe.", 404, "NOT_FOUND");
    }
    return payload;
  },
  async similares(id: string) {
    const items = await companies.similares(id);
    if (!items) {
      throw new AppError("La empresa no existe.", 404, "NOT_FOUND");
    }
    return { items };
  },
  async versusSector(id: string) {
    const payload = await companies.versusSector(id);
    if (!payload) {
      throw new AppError("La empresa no existe.", 404, "NOT_FOUND");
    }
    return payload;
  },
  compare(ids: string[]) {
    return companies.compare(ids);
  },
};

export const sectorService = {
  list() {
    return companies.sectors();
  },
  async detail(codigo: SectorCodigo) {
    const detail = await companies.sectorDetail(codigo);
    if (!detail) {
      throw new AppError("El sector no existe.", 404, "NOT_FOUND");
    }
    return detail;
  },
};

export const listService = {
  list(user: SessionUser) {
    return watchlists.list(user.id);
  },
  async add(user: SessionUser, watchlistId: string, companyId: string) {
    const result = await watchlists.add(user.id, watchlistId, companyId);
    if (result === "missing-list") {
      throw new AppError("La lista no existe.", 404, "NOT_FOUND");
    }
    if (result === "missing-company") {
      throw new AppError("La empresa no existe.", 404, "NOT_FOUND");
    }
    return { estado: result };
  },
  async remove(user: SessionUser, watchlistId: string, companyId: string) {
    const removed = await watchlists.remove(user.id, watchlistId, companyId);
    if (!removed) {
      throw new AppError("La empresa no está en la lista.", 404, "NOT_FOUND");
    }
  },
};

export const savedSearchService = {
  list(user: SessionUser) {
    return savedSearches.list(user.id);
  },
  async create(user: SessionUser, nombre: string, filtros: CompanyFilters) {
    const created = await savedSearches.create(user.id, nombre, filtros);
    if (created === "limit") {
      throw new AppError("Puedes guardar hasta 20 búsquedas", 400, "LIMIT");
    }
    return created;
  },
  async remove(user: SessionUser, id: string) {
    const removed = await savedSearches.remove(user.id, id);
    if (!removed) {
      throw new AppError("La búsqueda no existe.", 404, "NOT_FOUND");
    }
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

async function namesById() {
  const users = await prisma.user.findMany({ select: { id: true, nombre: true } });
  return new Map(users.map((user) => [user.id, user.nombre]));
}

function presentRule(rule: {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: RuleInput["categoria"];
  tipoEvento: string;
  campoObservado: string;
  condicion: RuleInput["condicion"];
  valorReferencia: string | null;
  severidad: RuleInput["severidad"];
  activa: boolean;
  alcance: RuleInput["alcance"];
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
  updatedById: string | null;
}, names: Map<string, string>) {
  const field = fieldById(rule.categoria, rule.campoObservado);
  return {
    ...rule,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    categoriaLabel: categoryLabel(rule.categoria),
    campoLabel: field?.label ?? rule.campoObservado,
    condicionLabel: operatorLabel(rule.condicion),
    createdBy: rule.createdById ? names.get(rule.createdById) ?? "Usuario" : "Sistema",
    updatedBy: rule.updatedById ? names.get(rule.updatedById) ?? "Usuario" : "Sistema",
  };
}

export const alertRuleService = {
  async list() {
    const [rules, names] = await Promise.all([
      prisma.alertRule.findMany({ orderBy: { updatedAt: "desc" } }),
      namesById(),
    ]);
    return rules.map((rule) => presentRule(rule, names));
  },
  async create(actor: SessionUser, input: RuleInput) {
    const field = assertRule(input);
    const created = await prisma.alertRule.create({
      data: {
        nombre: input.nombre,
        descripcion: input.descripcion,
        categoria: input.categoria,
        tipoEvento: field.tipoEvento as never,
        campoObservado: input.campoObservado,
        condicion: input.condicion,
        valorReferencia: input.valorReferencia?.trim() || null,
        severidad: input.severidad,
        activa: input.activa,
        alcance: input.alcance,
        esDemostrativa: false,
        createdById: actor.id,
        updatedById: actor.id,
      },
    });
    await syncRuleAlerts(prisma, created.id);
    await audit.write({
      userId: actor.id,
      accion: "CAMBIO_ADMINISTRATIVO",
      entidad: "AlertRule",
      entidadId: created.id,
      metadata: { operacion: "crear", nombre: created.nombre },
    });
    return presentRule(created, await namesById());
  },
  async update(actor: SessionUser, id: string, input: RuleInput) {
    const current = await prisma.alertRule.findUnique({ where: { id } });
    if (!current) throw new AppError("La regla no existe.", 404, "NOT_FOUND");
    const field = assertRule(input);
    const updated = await prisma.alertRule.update({
      where: { id },
      data: {
        nombre: input.nombre,
        descripcion: input.descripcion,
        categoria: input.categoria,
        tipoEvento: field.tipoEvento as never,
        campoObservado: input.campoObservado,
        condicion: input.condicion,
        valorReferencia: input.valorReferencia?.trim() || null,
        severidad: input.severidad,
        activa: input.activa,
        alcance: input.alcance,
        updatedById: actor.id,
      },
    });
    await syncRuleAlerts(prisma, id);
    await audit.write({
      userId: actor.id,
      accion: "CAMBIO_ADMINISTRATIVO",
      entidad: "AlertRule",
      entidadId: id,
      metadata: {
        operacion: "actualizar",
        antes: { condicion: current.condicion, valor: current.valorReferencia, severidad: current.severidad, activa: current.activa },
        despues: { condicion: updated.condicion, valor: updated.valorReferencia, severidad: updated.severidad, activa: updated.activa },
      },
    });
    return presentRule(updated, await namesById());
  },
  async duplicate(actor: SessionUser, id: string) {
    const current = await prisma.alertRule.findUnique({ where: { id } });
    if (!current) throw new AppError("La regla no existe.", 404, "NOT_FOUND");
    const created = await prisma.alertRule.create({
      data: {
        nombre: `Copia de ${current.nombre}`.slice(0, 80),
        descripcion: current.descripcion,
        categoria: current.categoria,
        tipoEvento: current.tipoEvento,
        campoObservado: current.campoObservado,
        condicion: current.condicion,
        valorReferencia: current.valorReferencia,
        severidad: current.severidad,
        activa: false,
        alcance: current.alcance,
        esDemostrativa: false,
        createdById: actor.id,
        updatedById: actor.id,
      },
    });
    await audit.write({
      userId: actor.id,
      accion: "CAMBIO_ADMINISTRATIVO",
      entidad: "AlertRule",
      entidadId: created.id,
      metadata: { operacion: "duplicar", origen: id },
    });
    return presentRule(created, await namesById());
  },
  async remove(actor: SessionUser, id: string) {
    const current = await prisma.alertRule.findUnique({ where: { id } });
    if (!current) throw new AppError("La regla no existe.", 404, "NOT_FOUND");
    await prisma.alert.deleteMany({ where: { ruleId: id } });
    await prisma.alertRule.delete({ where: { id } });
    await audit.write({
      userId: actor.id,
      accion: "CAMBIO_ADMINISTRATIVO",
      entidad: "AlertRule",
      entidadId: id,
      metadata: { operacion: "eliminar", nombre: current.nombre },
    });
  },
  preview(input: RuleInput, companyId: string) {
    return previewRule(prisma, input, companyId);
  },
};

export const auditService = audit;
