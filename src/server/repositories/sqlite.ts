import type { AccionAuditoria, Prisma, PrismaClient, RolCodigo, User } from "@prisma/client";

import type {
  AlertItem,
  CompanyListItem,
  DashboardPayload,
  CompanyProfile,
  GraphNode,
  GraphPayload,
  MonitoringItem,
  RelationItem,
  TimelineItem,
} from "@/shared/types/domain";
import type { AlertFilters, CompanyFilters, DashboardFilters, MonitoringFilters } from "@/shared/types/filters";
import { buildCompanySummary } from "@/shared/utils/company-summary";
import { formatAntiguedad, inDateRange, isoDate, monthKey } from "@/shared/utils/dates";
import { ESTADO_MATRICULA_LABEL, EVENTO_LABEL, REGISTRO_LABEL, RELACION_LABEL } from "@/shared/utils/labels";
import { includesText } from "@/shared/utils/text";
import type {
  AlertRepository,
  AuditRepository,
  CompanyRepository,
  DashboardRepository,
  MonitoringRepository,
  RoleRepository,
  SettingsRepository,
  UserRepository,
} from "@/server/repositories/interfaces";

type CompanyRecord = Prisma.CompanyGetPayload<Record<string, never>>;

function money(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value.toString());
}

function readChange(value: Prisma.JsonValue | null): TimelineItem["metadata"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  return {
    valorAnterior: record.valorAnterior == null ? null : String(record.valorAnterior),
    valorNuevo: record.valorNuevo == null ? null : String(record.valorNuevo),
  };
}

function toListItem(company: CompanyRecord, monitoreada: boolean): CompanyListItem {
  return {
    id: company.id,
    nit: company.nit,
    razonSocial: company.razonSocial,
    nombreComercial: company.nombreComercial,
    tipoRegistro: company.tipoRegistro,
    tipoOrganizacion: company.tipoOrganizacion,
    actividadEconomicaCodigo: company.actividadEconomicaCodigo,
    actividadEconomicaDescripcion: company.actividadEconomicaDescripcion,
    municipio: company.municipio,
    departamento: company.departamento,
    estadoMatricula: company.estadoMatricula,
    tamanoEmpresa: company.tamanoEmpresa,
    fechaUltimaActualizacion: company.fechaUltimaActualizacion.toISOString(),
    monitoreada,
  };
}

function matchesCompany(item: CompanyListItem, filters: CompanyFilters): boolean {
  const query = filters.q?.trim() ?? "";
  if (query) {
    const hit =
      includesText(item.nit, query) ||
      includesText(item.razonSocial, query) ||
      includesText(item.nombreComercial, query);
    if (!hit) {
      return false;
    }
  }
  if (filters.tipoRegistro && item.tipoRegistro !== filters.tipoRegistro) {
    return false;
  }
  if (filters.estadoMatricula && item.estadoMatricula !== filters.estadoMatricula) {
    return false;
  }
  if (filters.municipio && item.municipio !== filters.municipio) {
    return false;
  }
  if (filters.tamanoEmpresa && item.tamanoEmpresa !== filters.tamanoEmpresa) {
    return false;
  }
  if (filters.actividad) {
    const hit =
      includesText(item.actividadEconomicaCodigo, filters.actividad) ||
      includesText(item.actividadEconomicaDescripcion, filters.actividad);
    if (!hit) {
      return false;
    }
  }
  return true;
}

const profileInclude = {
  relaciones: {
    include: { person: true, relatedCompany: true, establishment: true },
    orderBy: { fechaInicio: "asc" as const },
  },
  eventos: { orderBy: { fecha: "asc" as const } },
  alertas: { orderBy: { fecha: "desc" as const } },
};

type ProfileRecord = Prisma.CompanyGetPayload<{ include: typeof profileInclude }>;

function toRelations(company: ProfileRecord): RelationItem[] {
  return company.relaciones.map((relation) => ({
    id: relation.id,
    tipo: relation.tipo,
    descripcion: relation.descripcion,
    porcentajeParticipacion: money(relation.porcentajeParticipacion),
    fechaInicio: relation.fechaInicio.toISOString(),
    fechaFin: relation.fechaFin?.toISOString() ?? null,
    vigente: relation.vigente,
    persona: relation.person
      ? {
          id: relation.person.id,
          nombre: relation.person.nombre,
          tipoDocumento: relation.person.tipoDocumento,
          numeroDocumento: relation.person.numeroDocumento,
        }
      : null,
    empresaRelacionada: relation.relatedCompany
      ? {
          id: relation.relatedCompany.id,
          razonSocial: relation.relatedCompany.razonSocial,
          nit: relation.relatedCompany.nit,
        }
      : null,
    establecimiento: relation.establishment
      ? {
          id: relation.establishment.id,
          nombre: relation.establishment.nombre,
          direccion: relation.establishment.direccion,
          municipio: relation.establishment.municipio,
          estado: relation.establishment.estado,
        }
      : null,
  }));
}

function toTimeline(company: ProfileRecord): TimelineItem[] {
  return company.eventos.map((event) => ({
    id: event.id,
    tipo: event.tipo,
    fecha: event.fecha.toISOString(),
    titulo: event.titulo,
    descripcion: event.descripcion,
    fuente: event.fuente,
    metadata: readChange(event.metadata),
  }));
}

function toAlerts(company: ProfileRecord): AlertItem[] {
  return company.alertas.map((alert) => ({
    id: alert.id,
    companyId: company.id,
    razonSocial: company.razonSocial,
    nit: company.nit,
    tipo: alert.tipo,
    titulo: alert.titulo,
    descripcion: alert.descripcion,
    severidad: alert.severidad,
    fecha: alert.fecha.toISOString(),
    leida: alert.leida,
  }));
}

function toProfile(company: ProfileRecord, monitoreada: boolean): CompanyProfile {
  const base = toListItem(company, monitoreada);
  return {
    ...base,
    numeroMatricula: company.numeroMatricula,
    fechaMatricula: company.fechaMatricula.toISOString(),
    fechaRenovacion: company.fechaRenovacion?.toISOString() ?? null,
    camaraComercio: company.camaraComercio,
    direccion: company.direccion,
    telefono: company.telefono,
    email: company.email,
    sitioWeb: company.sitioWeb,
    numeroEmpleados: company.numeroEmpleados,
    capital: money(company.capital),
    activos: money(company.activos),
    fechaConstitucion: company.fechaConstitucion?.toISOString() ?? null,
    estado: company.estado,
    representanteLegal: company.representanteLegal,
    resumen: buildCompanySummary({
      estadoMatricula: company.estadoMatricula,
      fechaRenovacion: company.fechaRenovacion?.toISOString() ?? null,
      fechaConstitucion: company.fechaConstitucion?.toISOString() ?? null,
      tipoOrganizacion: company.tipoOrganizacion,
      actividadEconomicaCodigo: company.actividadEconomicaCodigo,
      municipio: company.municipio,
      tamanoEmpresa: company.tamanoEmpresa,
      numeroEmpleados: company.numeroEmpleados,
    }),
    antiguedad: formatAntiguedad(company.fechaConstitucion?.toISOString() ?? null),
    relaciones: toRelations(company),
    timeline: toTimeline(company),
    alertas: toAlerts(company),
  };
}

function relationNode(relation: RelationItem): GraphNode {
  const tipo =
    relation.tipo === "REPRESENTANTE_LEGAL"
      ? "representante"
      : relation.tipo === "SOCIO"
        ? "socio"
        : relation.tipo === "ESTABLECIMIENTO"
          ? "establecimiento"
          : relation.tipo === "EMPRESA_RELACIONADA"
            ? "relacionada"
            : "persona";
  const titulo =
    relation.persona?.nombre ??
    relation.empresaRelacionada?.razonSocial ??
    relation.establecimiento?.nombre ??
    relation.descripcion;
  const campos: GraphNode["data"]["campos"] = [
    { etiqueta: "Tipo", valor: RELACION_LABEL[relation.tipo] },
    { etiqueta: "Vigencia", valor: relation.vigente ? "Vigente" : "No vigente" },
    { etiqueta: "Desde", valor: isoDate(relation.fechaInicio) },
  ];
  if (relation.fechaFin) {
    campos.push({ etiqueta: "Hasta", valor: isoDate(relation.fechaFin) });
  }
  if (relation.porcentajeParticipacion !== null) {
    campos.push({ etiqueta: "Participación", valor: `${relation.porcentajeParticipacion} %` });
  }
  if (relation.persona) {
    campos.push({
      etiqueta: "Documento",
      valor: `${relation.persona.tipoDocumento} ${relation.persona.numeroDocumento}`,
    });
  }
  if (relation.empresaRelacionada) {
    campos.push({ etiqueta: "NIT", valor: relation.empresaRelacionada.nit });
  }
  if (relation.establecimiento) {
    campos.push(
      { etiqueta: "Dirección", valor: relation.establecimiento.direccion },
      { etiqueta: "Municipio", valor: relation.establecimiento.municipio },
      { etiqueta: "Estado", valor: relation.establecimiento.estado === "ABIERTO" ? "Abierto" : "Cerrado" },
    );
  }
  campos.push({ etiqueta: "Descripción", valor: relation.descripcion });
  return {
    id: `rel-${relation.id}`,
    type: tipo,
    data: { titulo, subtitulo: RELACION_LABEL[relation.tipo], campos },
  };
}

function countBy(values: string[]): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const value of values) {
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "es"));
}

export class SqliteCompanyRepository implements CompanyRepository {
  constructor(private readonly db: PrismaClient) {}

  async search(userId: string, filters: CompanyFilters) {
    const [companies, monitored, audits] = await Promise.all([
      this.db.company.findMany({ orderBy: { razonSocial: "asc" } }),
      this.db.monitoredCompany.findMany({ where: { userId }, select: { companyId: true } }),
      this.db.auditLog.findMany({
        where: { userId, accion: "CONSULTA_EMPRESA" },
        orderBy: { fecha: "desc" },
        take: 40,
      }),
    ]);
    const monitoredIds = new Set(monitored.map((item) => item.companyId));
    const items = companies.map((company) => toListItem(company, monitoredIds.has(company.id)));
    const filtered = items.filter((item) => matchesCompany(item, filters));
    const seen = new Set<string>();
    const recientes: CompanyListItem[] = [];
    for (const audit of audits) {
      if (!audit.entidadId || seen.has(audit.entidadId)) {
        continue;
      }
      const match = items.find((item) => item.id === audit.entidadId);
      if (!match) {
        continue;
      }
      seen.add(audit.entidadId);
      recientes.push(match);
      if (recientes.length === 5) {
        break;
      }
    }
    const actividades = new Map<string, string>();
    for (const company of companies) {
      actividades.set(company.actividadEconomicaCodigo, company.actividadEconomicaDescripcion);
    }
    return {
      items: filtered,
      totalDisponibles: companies.length,
      recientes,
      opciones: {
        municipios: [...new Set(companies.map((company) => company.municipio))].sort((a, b) =>
          a.localeCompare(b, "es"),
        ),
        actividades: [...actividades.entries()]
          .map(([codigo, descripcion]) => ({ codigo, descripcion }))
          .sort((a, b) => a.codigo.localeCompare(b.codigo)),
      },
    };
  }

  async findById(id: string, userId: string): Promise<CompanyProfile | null> {
    const company = await this.db.company.findUnique({ where: { id }, include: profileInclude });
    if (!company) {
      return null;
    }
    const monitored = await this.db.monitoredCompany.findUnique({
      where: { userId_companyId: { userId, companyId: id } },
    });
    return toProfile(company, Boolean(monitored));
  }

  async graph(id: string): Promise<GraphPayload | null> {
    const company = await this.db.company.findUnique({ where: { id }, include: profileInclude });
    if (!company) {
      return null;
    }
    const profile = toProfile(company, false);
    const relations = profile.relaciones ?? [];
    const nodes: GraphNode[] = [
      {
        id: `empresa-${company.id}`,
        type: "empresa",
        data: {
          titulo: company.razonSocial,
          subtitulo: "Empresa",
          campos: [
            { etiqueta: "NIT", valor: company.nit },
            { etiqueta: "Registro", valor: REGISTRO_LABEL[company.tipoRegistro] },
            { etiqueta: "Matrícula", valor: ESTADO_MATRICULA_LABEL[company.estadoMatricula] },
            { etiqueta: "Municipio", valor: company.municipio },
            { etiqueta: "Actividad", valor: `${company.actividadEconomicaCodigo} · ${company.actividadEconomicaDescripcion}` },
          ],
        },
      },
      ...relations.map(relationNode),
    ];
    return {
      nodes,
      edges: relations.map((relation) => ({
        id: `edge-${relation.id}`,
        source: `empresa-${company.id}`,
        target: `rel-${relation.id}`,
        label: relation.vigente ? RELACION_LABEL[relation.tipo] : `${RELACION_LABEL[relation.tipo]} · histórica`,
      })),
    };
  }
}

export class SqliteMonitoringRepository implements MonitoringRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(userId: string, filters: MonitoringFilters): Promise<MonitoringItem[]> {
    const rows = await this.db.monitoredCompany.findMany({
      where: { userId },
      include: { company: { include: { alertas: true } } },
      orderBy: { fechaInicio: "desc" },
    });
    return rows
      .map((row) => ({
        companyId: row.companyId,
        razonSocial: row.company.razonSocial,
        nit: row.company.nit,
        nombreComercial: row.company.nombreComercial,
        fechaInicio: row.fechaInicio.toISOString(),
        fechaUltimaActualizacion: row.company.fechaUltimaActualizacion.toISOString(),
        alertas: row.company.alertas.length,
        estadoMatricula: row.company.estadoMatricula,
        municipio: row.company.municipio,
      }))
      .filter((item) => {
        if (filters.estadoMatricula && item.estadoMatricula !== filters.estadoMatricula) {
          return false;
        }
        if (!filters.q) {
          return true;
        }
        return includesText(item.razonSocial, filters.q) || includesText(item.nit, filters.q);
      });
  }

  async add(userId: string, companyId: string): Promise<"created" | "exists" | "missing"> {
    const company = await this.db.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!company) {
      return "missing";
    }
    const existing = await this.db.monitoredCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (existing) {
      return "exists";
    }
    await this.db.monitoredCompany.create({
      data: { userId, companyId, fechaInicio: new Date() },
    });
    return "created";
  }

  async remove(userId: string, companyId: string): Promise<boolean> {
    const existing = await this.db.monitoredCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!existing) {
      return false;
    }
    await this.db.monitoredCompany.delete({ where: { id: existing.id } });
    return true;
  }
}

export class SqliteAlertRepository implements AlertRepository {
  constructor(private readonly db: PrismaClient) {}

  async search(filters: AlertFilters) {
    const alerts = await this.db.alert.findMany({
      include: { company: true },
      orderBy: { fecha: "desc" },
    });
    const noLeidas = alerts.filter((alert) => !alert.leida).length;
    const items = alerts
      .filter((alert) => {
        if (filters.companyId && alert.companyId !== filters.companyId) {
          return false;
        }
        if (filters.tipo && alert.tipo !== filters.tipo) {
          return false;
        }
        if (filters.severidad && alert.severidad !== filters.severidad) {
          return false;
        }
        if (filters.leida !== undefined && alert.leida !== filters.leida) {
          return false;
        }
        if (!inDateRange(alert.fecha.toISOString(), filters.desde, filters.hasta)) {
          return false;
        }
        if (filters.q) {
          const hit =
            includesText(alert.company.razonSocial, filters.q) ||
            includesText(alert.company.nit, filters.q) ||
            includesText(alert.titulo, filters.q);
          if (!hit) {
            return false;
          }
        }
        return true;
      })
      .map((alert) => ({
        id: alert.id,
        companyId: alert.companyId,
        razonSocial: alert.company.razonSocial,
        nit: alert.company.nit,
        tipo: alert.tipo,
        titulo: alert.titulo,
        descripcion: alert.descripcion,
        severidad: alert.severidad,
        fecha: alert.fecha.toISOString(),
        leida: alert.leida,
      }));
    return { items, noLeidas };
  }

  async markRead(id: string): Promise<AlertItem | null> {
    const existing = await this.db.alert.findUnique({ where: { id }, include: { company: true } });
    if (!existing) {
      return null;
    }
    const alert = await this.db.alert.update({
      where: { id },
      data: { leida: true },
      include: { company: true },
    });
    return {
      id: alert.id,
      companyId: alert.companyId,
      razonSocial: alert.company.razonSocial,
      nit: alert.company.nit,
      tipo: alert.tipo,
      titulo: alert.titulo,
      descripcion: alert.descripcion,
      severidad: alert.severidad,
      fecha: alert.fecha.toISOString(),
      leida: alert.leida,
    };
  }
}

export class SqliteDashboardRepository implements DashboardRepository {
  constructor(private readonly db: PrismaClient) {}

  async aggregates(filters: DashboardFilters): Promise<DashboardPayload> {
    const [companies, alerts, audits, monitored] = await Promise.all([
      this.db.company.findMany(),
      this.db.alert.findMany({ include: { company: true } }),
      this.db.auditLog.findMany({ where: { accion: "CONSULTA_EMPRESA" }, include: { user: false } }),
      this.db.monitoredCompany.findMany({ include: { company: true } }),
    ]);
    const structural = companies.filter((company) => {
      if (filters.tipoRegistro && company.tipoRegistro !== filters.tipoRegistro) {
        return false;
      }
      if (filters.municipio && company.municipio !== filters.municipio) {
        return false;
      }
      if (filters.estadoMatricula && company.estadoMatricula !== filters.estadoMatricula) {
        return false;
      }
      if (
        (filters.desde || filters.hasta) &&
        !inDateRange(company.fechaUltimaActualizacion.toISOString(), filters.desde, filters.hasta)
      ) {
        return false;
      }
      return true;
    });
    const ids = new Set(structural.map((company) => company.id));
    const companyWithoutDate = companies.filter((company) => {
      if (filters.tipoRegistro && company.tipoRegistro !== filters.tipoRegistro) {
        return false;
      }
      if (filters.municipio && company.municipio !== filters.municipio) {
        return false;
      }
      if (filters.estadoMatricula && company.estadoMatricula !== filters.estadoMatricula) {
        return false;
      }
      return true;
    });
    const population = filters.desde || filters.hasta ? structural : companyWithoutDate;
    const populationIds = new Set(population.map((company) => company.id));
    const alertRows = alerts.filter(
      (alert) =>
        populationIds.has(alert.companyId) &&
        inDateRange(alert.fecha.toISOString(), filters.desde, filters.hasta),
    );
    const consulted = new Set(
      audits
        .filter(
          (audit) =>
            audit.entidadId &&
            populationIds.has(audit.entidadId) &&
            inDateRange(audit.fecha.toISOString(), filters.desde, filters.hasta),
        )
        .map((audit) => audit.entidadId as string),
    );
    const monitoredRows = monitored.filter(
      (row) =>
        populationIds.has(row.companyId) &&
        inDateRange(row.fechaInicio.toISOString(), filters.desde, filters.hasta),
    );
    const monitoredCompanies = new Set(monitoredRows.map((row) => row.companyId));
    void ids;
    return {
      kpis: {
        consultadas: consulted.size,
        monitoreadas: monitoredCompanies.size,
        alertasGeneradas: alertRows.length,
        mercantil: population.filter((company) => company.tipoRegistro === "MERCANTIL").length,
        esal: population.filter((company) => company.tipoRegistro === "ESAL").length,
      },
      empresasPorTipo: countBy(population.map((company) => REGISTRO_LABEL[company.tipoRegistro])),
      empresasPorEstado: countBy(population.map((company) => ESTADO_MATRICULA_LABEL[company.estadoMatricula])),
      empresasPorActividad: countBy(
        population.map((company) => `${company.actividadEconomicaCodigo} ${company.actividadEconomicaDescripcion}`),
      ),
      alertasPorTipo: countBy(alertRows.map((alert) => EVENTO_LABEL[alert.tipo])),
      alertasEnElTiempo: countBy(alertRows.map((alert) => monthKey(alert.fecha))).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
      monitoreadasPorMunicipio: countBy(
        monitoredRows
          .filter((row, index, list) => list.findIndex((item) => item.companyId === row.companyId) === index)
          .map((row) => row.company.municipio),
      ),
      opciones: {
        municipios: [...new Set(companies.map((company) => company.municipio))].sort((a, b) =>
          a.localeCompare(b, "es"),
        ),
      },
    };
  }
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async list() {
    const users = await this.db.user.findMany({ orderBy: { nombre: "asc" } });
    return users.map(toAdminUser);
  }

  async create(input: { email: string; nombre: string; passwordHash: string; rol: RolCodigo }) {
    const user = await this.db.user.create({
      data: {
        email: input.email.toLowerCase(),
        nombre: input.nombre,
        passwordHash: input.passwordHash,
        rol: input.rol,
        activo: true,
      },
    });
    return toAdminUser(user);
  }

  async update(id: string, input: { nombre?: string; rol?: RolCodigo; activo?: boolean; passwordHash?: string }) {
    const existing = await this.db.user.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }
    const user = await this.db.user.update({
      where: { id },
      data: {
        nombre: input.nombre,
        rol: input.rol,
        activo: input.activo,
        passwordHash: input.passwordHash,
      },
    });
    return toAdminUser(user);
  }

  async findById(id: string) {
    const user = await this.db.user.findUnique({ where: { id } });
    return user ? toAdminUser(user) : null;
  }

  async countActiveAdmins(exceptId?: string) {
    return this.db.user.count({
      where: {
        rol: "ADMINISTRADOR",
        activo: true,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
  }
}

function toAdminUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    activo: user.activo,
    createdAt: user.createdAt.toISOString(),
  };
}

export class SqliteAuditRepository implements AuditRepository {
  constructor(private readonly db: PrismaClient) {}

  async write(entry: {
    userId: string;
    accion: AccionAuditoria;
    entidad: string;
    entidadId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    await this.db.auditLog.create({
      data: {
        userId: entry.userId,
        accion: entry.accion,
        entidad: entry.entidad,
        entidadId: entry.entidadId,
        fecha: new Date(),
        metadata: entry.metadata,
      },
    });
  }
}

export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly db: PrismaClient) {}

  async list() {
    const rows = await this.db.appSetting.findMany({ orderBy: { clave: "asc" } });
    return rows.map((row) => ({ clave: row.clave, valor: row.valor, descripcion: row.descripcion }));
  }

  async update(clave: string, valor: string) {
    const existing = await this.db.appSetting.findUnique({ where: { clave } });
    if (!existing) {
      return null;
    }
    const row = await this.db.appSetting.update({ where: { clave }, data: { valor } });
    return { clave: row.clave, valor: row.valor, descripcion: row.descripcion };
  }
}

export class SqliteRoleRepository implements RoleRepository {
  constructor(private readonly db: PrismaClient) {}

  async list() {
    const roles = await this.db.role.findMany({
      include: { permisos: { include: { permission: true } } },
      orderBy: { nombre: "asc" },
    });
    return roles.map((role) => ({
      codigo: role.codigo,
      nombre: role.nombre,
      descripcion: role.descripcion,
      permisos: role.permisos
        .map((item) => ({
          codigo: item.permission.codigo as AdminRolePermission,
          descripcion: item.permission.descripcion,
          modulo: item.permission.modulo,
        }))
        .sort((a, b) => a.modulo.localeCompare(b.modulo, "es")),
    }));
  }
}

type AdminRolePermission = import("@/shared/types/domain").PermissionCode;
