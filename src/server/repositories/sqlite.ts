import type { AccionAuditoria, Prisma, PrismaClient, RolCodigo, User } from "@prisma/client";

import { buildCompanyGraph } from "@/server/services/company-graph";
import type {
  AlertItem,
  CompanyListItem,
  ComparadorColumna,
  ComparadorPayload,
  Cobertura,
  DashboardPayload,
  CompanyProfile,
  FinancePayload,
  GraphPayload,
  IndicatorSet,
  MonitoringItem,
  RelationItem,
  SavedSearchItem,
  SectorCodigo,
  SectorComparisonPayload,
  SectorDetalle,
  SectorResumen,
  SimilarItem,
  SortDir,
  SortKey,
  TimelineItem,
  UltimoPeriodo,
  VinculoPersona,
  WatchlistItem,
} from "@/shared/types/domain";
import { SECTOR_CODIGOS } from "@/shared/types/domain";
import type { AlertFilters, CompanyFilters, DashboardFilters, MonitoringFilters } from "@/shared/types/filters";
import { buildCompanySummary } from "@/shared/utils/company-summary";
import { dateOnly, formatAntiguedad, inDateRange, isoDate, monthKey } from "@/shared/utils/dates";
import { DIRECTIVE_TYPES, LINK_TYPES, categoriaDeEvento } from "@/shared/utils/event-category";
import {
  CATEGORIA_LABEL,
  ESTADO_MATRICULA_LABEL,
  EVENTO_LABEL,
  LISTA_LABEL,
  REGISTRO_LABEL,
  RELACION_LABEL,
  SECTOR_LABEL,
  SLUG_SECTOR,
  TAMANO_LABEL,
} from "@/shared/utils/labels";
import { attachVinculosByPerson } from "@/shared/utils/person-relations";
import { includesText } from "@/shared/utils/text";
import {
  difference,
  indicatorsBetween,
  indicatorsByYear,
  indicatorsFor,
  ratio,
  sortPeriods,
  type PeriodAmounts,
} from "@/server/services/financial-indicators";
import { rankSimilar, type SimilarCandidate } from "@/server/services/similar-companies";
import type {
  AlertRepository,
  AuditRepository,
  CompanyRepository,
  DashboardRepository,
  MonitoringRepository,
  RoleRepository,
  SavedSearchRepository,
  SettingsRepository,
  UserRepository,
  WatchlistRepository,
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

type PeriodRow = {
  year: number;
  revenue: Prisma.Decimal;
  ebitda: Prisma.Decimal;
  netProfit: Prisma.Decimal;
  totalAssets: Prisma.Decimal;
  totalLiabilities: Prisma.Decimal;
  equity: Prisma.Decimal;
  employees: number;
  currentAssets: Prisma.Decimal | null;
  currentLiabilities: Prisma.Decimal | null;
};

function toAmounts(period: PeriodRow): PeriodAmounts {
  return {
    year: period.year,
    revenue: money(period.revenue) ?? 0,
    ebitda: money(period.ebitda) ?? 0,
    netProfit: money(period.netProfit) ?? 0,
    totalAssets: money(period.totalAssets) ?? 0,
    totalLiabilities: money(period.totalLiabilities) ?? 0,
    equity: money(period.equity) ?? 0,
    employees: period.employees,
    currentAssets: money(period.currentAssets),
    currentLiabilities: money(period.currentLiabilities),
  };
}

function latestAmounts(periods: PeriodRow[]): PeriodAmounts | null {
  const sorted = sortPeriods(periods.map(toAmounts));
  return sorted[sorted.length - 1] ?? null;
}

function toListItem(company: CompanyRecord & { periodos?: PeriodRow[] }, monitoreada: boolean): CompanyListItem {
  const latest = latestAmounts(company.periodos ?? []);
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
    sector: company.sector,
    numeroEmpleados: company.numeroEmpleados ?? latest?.employees ?? null,
    ingresos: latest?.revenue ?? null,
    activosEstados: latest?.totalAssets ?? null,
  };
}

function inRange(value: number | null, min?: number, max?: number): boolean {
  if (min === undefined && max === undefined) {
    return true;
  }
  if (value === null || !Number.isFinite(value)) {
    return false;
  }
  if (min !== undefined && value < min) {
    return false;
  }
  if (max !== undefined && value > max) {
    return false;
  }
  return true;
}

function compareNullable(a: string | number | null, b: string | number | null, dir: SortDir): number {
  if (a === null && b === null) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }
  const factor = dir === "desc" ? -1 : 1;
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b, "es") * factor;
  }
  return ((a as number) - (b as number)) * factor;
}

function sortValue(item: CompanyListItem, sort: SortKey): string | number | null {
  switch (sort) {
    case "nit":
      return item.nit;
    case "sector":
      return SECTOR_LABEL[item.sector];
    case "municipio":
      return item.municipio;
    case "revenue":
      return item.ingresos;
    case "totalAssets":
      return item.activosEstados;
    case "employees":
      return item.numeroEmpleados;
    case "estadoMatricula":
      return item.estadoMatricula;
    default:
      return item.razonSocial;
  }
}

function sortCompanies(items: CompanyListItem[], sort: SortKey, dir: SortDir): CompanyListItem[] {
  return [...items].sort(
    (left, right) =>
      compareNullable(sortValue(left, sort), sortValue(right, sort), dir) ||
      left.razonSocial.localeCompare(right.razonSocial, "es"),
  );
}

function matchesCompany(item: CompanyListItem, filters: CompanyFilters): boolean {
  const query = filters.q?.trim() ?? "";
  if (query) {
    const hit =
      includesText(item.nit, query) ||
      includesText(item.razonSocial, query) ||
      includesText(item.nombreComercial, query) ||
      includesText(item.actividadEconomicaCodigo, query) ||
      includesText(item.actividadEconomicaDescripcion, query) ||
      includesText(SECTOR_LABEL[item.sector], query);
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
  if (filters.departamento && item.departamento !== filters.departamento) {
    return false;
  }
  if (filters.sector && item.sector !== filters.sector) {
    return false;
  }
  if (filters.tamanoEmpresa && item.tamanoEmpresa !== filters.tamanoEmpresa) {
    return false;
  }
  if (!inRange(item.numeroEmpleados, filters.empleadosMin, filters.empleadosMax)) {
    return false;
  }
  if (!inRange(item.ingresos, filters.ingresosMin, filters.ingresosMax)) {
    return false;
  }
  if (!inRange(item.activosEstados, filters.activosMin, filters.activosMax)) {
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
  periodos: { orderBy: { year: "asc" as const } },
};

type ProfileRecord = Prisma.CompanyGetPayload<{ include: typeof profileInclude }>;

function toRelations(company: ProfileRecord): RelationItem[] {
  return company.relaciones.map((relation) => ({
    id: relation.id,
    tipo: relation.tipo,
    cargo: relation.cargo,
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
          vinculos: [],
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
  const events: TimelineItem[] = company.eventos.map((event) => ({
    id: event.id,
    tipo: event.tipo,
    categoria: event.categoria,
    fecha: event.fecha.toISOString(),
    titulo: event.titulo,
    descripcion: event.descripcion,
    fuente: event.fuente,
    metadata: readChange(event.metadata),
  }));
  const alerts: TimelineItem[] = company.alertas.map((alert) => ({
    id: `alert-${alert.id}`,
    tipo: alert.tipo,
    categoria: "ALERTA",
    fecha: alert.fecha.toISOString(),
    titulo: alert.titulo,
    descripcion: alert.descripcion,
    fuente: "Datos de demostración",
    metadata: readChange(alert.metadata),
  }));
  const financial: TimelineItem[] = company.periodos.map((period) => ({
    id: `fin-${company.id}-${period.year}`,
    tipo: null,
    categoria: "FINANCIERO",
    fecha: dateOnly(`${period.year}-12-31`).toISOString(),
    titulo: `Estados de ${period.year}`,
    descripcion: `Estados de resultados y situación financiera de ${period.year}.`,
    fuente: "Datos de demostración",
    metadata: null,
  }));
  return [...events, ...alerts, ...financial].sort((left, right) => right.fecha.localeCompare(left.fecha));
}

function buildCoverage(company: ProfileRecord, relations: RelationItem[]): Cobertura {
  const complete = Boolean(
    company.nit &&
      company.razonSocial &&
      company.numeroMatricula &&
      company.municipio &&
      company.actividadEconomicaCodigo &&
      company.estadoMatricula,
  );
  const directivos = relations.filter((relation) => relation.vigente && DIRECTIVE_TYPES.has(relation.tipo)).length;
  const socios = relations.filter((relation) => relation.vigente && relation.tipo === "SOCIO").length;
  const vinculos = relations.filter((relation) => relation.vigente && LINK_TYPES.has(relation.tipo)).length;
  const years = company.periodos.length;
  return {
    registral: complete ? "Completa" : "Incompleta",
    financiera: years === 0 ? "Sin periodos" : years === 1 ? "1 año" : `${years} años`,
    directivos: `${directivos} cargos vigentes`,
    propiedad: `${socios} accionistas vigentes`,
    relaciones: `${vinculos} vínculos vigentes`,
    ultimaActualizacion: company.fechaUltimaActualizacion.toISOString(),
  };
}

function buildUltimoPeriodo(periods: PeriodAmounts[]): UltimoPeriodo | null {
  const sorted = sortPeriods(periods);
  const current = sorted[sorted.length - 1];
  if (!current) {
    return null;
  }
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] ?? null : null;
  return {
    year: current.year,
    ingresos: current.revenue,
    activos: current.totalAssets,
    patrimonio: current.equity,
    utilidad: current.netProfit,
    empleados: current.employees,
    variacionIngresos: previous ? ratio(current.revenue - previous.revenue, previous.revenue) : null,
    variacionActivos: previous ? ratio(current.totalAssets - previous.totalAssets, previous.totalAssets) : null,
    variacionPatrimonio: previous ? ratio(current.equity - previous.equity, previous.equity) : null,
    variacionUtilidad: previous ? ratio(current.netProfit - previous.netProfit, previous.netProfit) : null,
    variacionEmpleados: previous ? ratio(current.employees - previous.employees, previous.employees) : null,
    anioAnterior: previous?.year ?? null,
  };
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

function toProfile(company: ProfileRecord, monitoreada: boolean, relaciones: RelationItem[]): CompanyProfile {
  const base = toListItem(company, monitoreada);
  const periods = company.periodos.map(toAmounts);
  const ultimoPeriodo = buildUltimoPeriodo(periods);
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
    fuenteDatos: company.fuenteDatos,
    cobertura: buildCoverage(company, relaciones),
    ultimoPeriodo,
    resumen: buildCompanySummary({
      estadoMatricula: company.estadoMatricula,
      fechaRenovacion: company.fechaRenovacion?.toISOString() ?? null,
      fechaConstitucion: company.fechaConstitucion?.toISOString() ?? null,
      tipoOrganizacion: company.tipoOrganizacion,
      actividadEconomicaCodigo: company.actividadEconomicaCodigo,
      municipio: company.municipio,
      tamanoEmpresa: company.tamanoEmpresa,
      numeroEmpleados: company.numeroEmpleados,
      sector: company.sector,
      ingresosUltimoAnio: ultimoPeriodo?.ingresos ?? null,
      anioIngresos: ultimoPeriodo?.year ?? null,
    }),
    antiguedad: formatAntiguedad(company.fechaConstitucion?.toISOString() ?? null),
    relaciones,
    timeline: toTimeline(company),
    alertas: toAlerts(company),
  };
}

async function relationsWithPeople(db: PrismaClient, company: ProfileRecord): Promise<RelationItem[]> {
  const relations = toRelations(company);
  const personIds = [...new Set(relations.flatMap((item) => (item.persona ? [item.persona.id] : [])))];
  if (personIds.length === 0) {
    return relations;
  }
  const rows = await db.companyRelation.findMany({
    where: { personId: { in: personIds }, tipo: { in: ["SOCIO", "REPRESENTANTE_LEGAL"] } },
    include: { company: { select: { id: true, razonSocial: true, nit: true } } },
  });
  const rolesByPerson = new Map<string, VinculoPersona[]>();
  for (const row of rows) {
    if (!row.personId || (row.tipo !== "SOCIO" && row.tipo !== "REPRESENTANTE_LEGAL")) {
      continue;
    }
    const list = rolesByPerson.get(row.personId) ?? [];
    list.push({
      relacionId: row.id,
      companyId: row.company.id,
      razonSocial: row.company.razonSocial,
      nit: row.company.nit,
      tipo: row.tipo,
      porcentajeParticipacion: money(row.porcentajeParticipacion),
      vigente: row.vigente,
      fechaInicio: row.fechaInicio.toISOString(),
      fechaFin: row.fechaFin?.toISOString() ?? null,
    });
    rolesByPerson.set(row.personId, list);
  }
  return attachVinculosByPerson(relations, rolesByPerson);
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
      this.db.company.findMany({ orderBy: { razonSocial: "asc" }, include: { periodos: true } }),
      this.db.monitoredCompany.findMany({ where: { userId }, select: { companyId: true } }),
      this.db.auditLog.findMany({
        where: { userId, accion: "CONSULTA_EMPRESA" },
        orderBy: { fecha: "desc" },
        take: 40,
      }),
    ]);
    const monitoredIds = new Set(monitored.map((item) => item.companyId));
    const items = companies.map((company) => toListItem(company, monitoredIds.has(company.id)));
    const filtered = sortCompanies(
      items.filter((item) => matchesCompany(item, filters)),
      filters.sort ?? "razonSocial",
      filters.dir ?? "asc",
    );
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
        departamentos: [...new Set(companies.map((company) => company.departamento))].sort((a, b) =>
          a.localeCompare(b, "es"),
        ),
        sectores: [...SECTOR_CODIGOS],
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
    const relaciones = await relationsWithPeople(this.db, company);
    return toProfile(company, Boolean(monitored), relaciones);
  }

  async graph(id: string): Promise<GraphPayload | null> {
    const company = await this.db.company.findUnique({ where: { id }, include: profileInclude });
    if (!company) {
      return null;
    }
    const relations = await relationsWithPeople(this.db, company);
    return buildCompanyGraph({
      companyId: company.id,
      company: {
        id: `empresa-${company.id}`,
        type: "empresa",
        data: {
          titulo: company.razonSocial,
          subtitulo: "Empresa",
          empresaId: null,
          campos: [
            { etiqueta: "NIT", valor: company.nit },
            { etiqueta: "Registro", valor: REGISTRO_LABEL[company.tipoRegistro] },
            { etiqueta: "Matrícula", valor: ESTADO_MATRICULA_LABEL[company.estadoMatricula] },
            { etiqueta: "Municipio", valor: company.municipio },
            { etiqueta: "Actividad", valor: `${company.actividadEconomicaCodigo} · ${company.actividadEconomicaDescripcion}` },
          ],
        },
      },
      relations,
    });
  }

  async finances(id: string): Promise<FinancePayload | null> {
    const company = await this.db.company.findUnique({
      where: { id },
      include: { periodos: { orderBy: { year: "asc" } } },
    });
    if (!company) {
      return null;
    }
    const periods = company.periodos.map(toAmounts);
    const byYear = indicatorsByYear(periods);
    return {
      fuente: "DEMO",
      indicadores: indicatorsFor(periods),
      periodos: periods.map((period) => ({
        ...period,
        indicadores: byYear.get(period.year) ?? indicatorsFor([]),
      })),
    };
  }

  async similares(id: string): Promise<SimilarItem[] | null> {
    const companies = await this.db.company.findMany({ include: { periodos: true } });
    const target = companies.find((company) => company.id === id);
    if (!target) {
      return null;
    }
    const candidates = companies.map(toCandidate);
    const ranked = rankSimilar(toCandidate(target), candidates);
    return ranked.map(({ item, puntaje }) => ({
      id: item.id,
      razonSocial: item.razonSocial,
      nit: item.nit,
      sector: item.sector,
      ciudad: item.municipio,
      tamanoEmpresa: item.tamanoEmpresa,
      ingresos: item.revenue,
      puntaje,
    }));
  }

  async versusSector(id: string): Promise<SectorComparisonPayload | null> {
    const company = await this.db.company.findUnique({
      where: { id },
      include: { periodos: { orderBy: { year: "asc" } } },
    });
    if (!company) {
      return null;
    }
    const periods = company.periodos.map(toAmounts);
    const current = sortPeriods(periods).at(-1);
    if (!current) {
      return { vacio: true };
    }
    const benchmarks = await this.db.sectorBenchmark.findMany({
      where: { sector: company.sector },
      orderBy: { year: "asc" },
    });
    const eligible = benchmarks.filter((item) => item.year <= current.year);
    const chosen = eligible.at(-1);
    if (!chosen) {
      return { vacio: true };
    }
    const benchmarkPeriods = eligible.map(benchmarkPeriod);
    const previousCompany = sortPeriods(periods).at(-2) ?? null;
    const companyIndicators = indicatorsBetween(current, previousCompany);
    const sectorIndicators = indicatorsFor(benchmarkPeriods);
    const sectorCurrent = sortPeriods(benchmarkPeriods).at(-1);
    if (!sectorCurrent) {
      return { vacio: true };
    }
    const filas = comparisonRows(current, companyIndicators, sectorCurrent, sectorIndicators);
    return { anio: chosen.year, filas };
  }

  async compare(ids: string[]): Promise<ComparadorPayload> {
    const companies = await this.db.company.findMany({
      where: { id: { in: ids } },
      include: { periodos: true },
    });
    const byId = new Map(companies.map((company) => [company.id, company]));
    const ausentes = ids.filter((id) => !byId.has(id));
    const columnas = ids.flatMap((id) => {
      const company = byId.get(id);
      return company ? [toComparador(company)] : [];
    });
    return { columnas, ausentes };
  }

  async sectors(): Promise<SectorResumen[]> {
    const companies = await this.db.company.findMany({ include: { periodos: true } });
    return SECTOR_CODIGOS.map((codigo) => sectorResumen(codigo, companies));
  }

  async sectorDetail(codigo: SectorCodigo): Promise<SectorDetalle | null> {
    if (!SECTOR_CODIGOS.includes(codigo)) {
      return null;
    }
    const [companies, benchmarks] = await Promise.all([
      this.db.company.findMany({ include: { periodos: true } }),
      this.db.sectorBenchmark.findMany({ where: { sector: codigo }, orderBy: { year: "asc" } }),
    ]);
    const resumen = sectorResumen(codigo, companies);
    const inSector = companies.filter((company) => company.sector === codigo);
    const principales = [...inSector]
      .map((company) => ({ company, revenue: latestAmounts(company.periodos)?.revenue ?? null }))
      .sort((left, right) => {
        if (left.revenue === null && right.revenue === null) {
          return left.company.razonSocial.localeCompare(right.company.razonSocial, "es");
        }
        if (left.revenue === null) return 1;
        if (right.revenue === null) return -1;
        return right.revenue - left.revenue || left.company.razonSocial.localeCompare(right.company.razonSocial, "es");
      })
      .slice(0, 5)
      .map(({ company, revenue }) => ({
        id: company.id,
        razonSocial: company.razonSocial,
        nit: company.nit,
        municipio: company.municipio,
        ingresos: revenue,
      }));
    const years = new Map<number, number>();
    for (const company of inSector) {
      for (const period of company.periodos) {
        years.set(period.year, (years.get(period.year) ?? 0) + (money(period.revenue) ?? 0));
      }
    }
    const benchmarkPeriods = benchmarks.map(benchmarkPeriod);
    const latestBenchmark = benchmarks.at(-1) ?? null;
    return {
      ...resumen,
      resumen: sectorSentence(SECTOR_LABEL[codigo], inSector),
      principales,
      porTamano: countBy(inSector.map((company) => TAMANO_LABEL[company.tamanoEmpresa])),
      porMunicipio: countBy(inSector.map((company) => company.municipio)),
      evolucionIngresos: [...years.entries()]
        .sort((left, right) => left[0] - right[0])
        .map(([year, ingresos]) => ({ year, ingresos })),
      indicadores: indicatorsFor(benchmarkPeriods),
      anioBenchmark: latestBenchmark?.year ?? null,
    };
  }
}

function toCandidate(company: CompanyRecord & { periodos: PeriodRow[] }): SimilarCandidate {
  return {
    id: company.id,
    razonSocial: company.razonSocial,
    nit: company.nit,
    sector: company.sector,
    municipio: company.municipio,
    tamanoEmpresa: company.tamanoEmpresa,
    actividadEconomicaCodigo: company.actividadEconomicaCodigo,
    revenue: latestAmounts(company.periodos)?.revenue ?? null,
  };
}

function benchmarkPeriod(row: {
  year: number;
  avgRevenue: Prisma.Decimal;
  avgEbitda: Prisma.Decimal;
  avgNetProfit: Prisma.Decimal;
  avgAssets: Prisma.Decimal;
  avgLiabilities: Prisma.Decimal;
  avgEquity: Prisma.Decimal;
  avgEmployees: Prisma.Decimal;
}): PeriodAmounts {
  return {
    year: row.year,
    revenue: money(row.avgRevenue) ?? 0,
    ebitda: money(row.avgEbitda) ?? 0,
    netProfit: money(row.avgNetProfit) ?? 0,
    totalAssets: money(row.avgAssets) ?? 0,
    totalLiabilities: money(row.avgLiabilities) ?? 0,
    equity: money(row.avgEquity) ?? 0,
    employees: Math.round(money(row.avgEmployees) ?? 0),
    currentAssets: null,
    currentLiabilities: null,
  };
}

function comparisonRows(
  company: PeriodAmounts,
  companyIndicators: IndicatorSet,
  sector: PeriodAmounts,
  sectorIndicators: IndicatorSet,
): SectorComparisonPayload["filas"] {
  const specs: {
    clave: string;
    etiqueta: string;
    formato: "money" | "percent" | "times" | "number";
    empresa: number | null;
    promedio: number | null;
  }[] = [
    { clave: "ingresos", etiqueta: "Ingresos", formato: "money", empresa: company.revenue, promedio: sector.revenue },
    { clave: "ebitda", etiqueta: "EBITDA", formato: "money", empresa: company.ebitda, promedio: sector.ebitda },
    { clave: "utilidad", etiqueta: "Utilidad", formato: "money", empresa: company.netProfit, promedio: sector.netProfit },
    { clave: "activos", etiqueta: "Activos", formato: "money", empresa: company.totalAssets, promedio: sector.totalAssets },
    { clave: "pasivos", etiqueta: "Pasivos", formato: "money", empresa: company.totalLiabilities, promedio: sector.totalLiabilities },
    { clave: "patrimonio", etiqueta: "Patrimonio", formato: "money", empresa: company.equity, promedio: sector.equity },
    { clave: "empleados", etiqueta: "Empleados", formato: "number", empresa: company.employees, promedio: sector.employees },
    { clave: "margenNeto", etiqueta: "Margen neto", formato: "percent", empresa: companyIndicators.margenNeto, promedio: sectorIndicators.margenNeto },
    { clave: "margenOperativo", etiqueta: "Margen operativo", formato: "percent", empresa: companyIndicators.margenOperativo, promedio: sectorIndicators.margenOperativo },
    { clave: "roa", etiqueta: "ROA", formato: "percent", empresa: companyIndicators.roa, promedio: sectorIndicators.roa },
    { clave: "roe", etiqueta: "ROE", formato: "percent", empresa: companyIndicators.roe, promedio: sectorIndicators.roe },
    { clave: "deudaPatrimonio", etiqueta: "Deuda / patrimonio", formato: "times", empresa: companyIndicators.deudaPatrimonio, promedio: sectorIndicators.deudaPatrimonio },
    { clave: "crecimientoIngresos", etiqueta: "Crecimiento de ingresos", formato: "percent", empresa: companyIndicators.crecimientoIngresos, promedio: sectorIndicators.crecimientoIngresos },
    { clave: "crecimientoActivos", etiqueta: "Crecimiento de activos", formato: "percent", empresa: companyIndicators.crecimientoActivos, promedio: sectorIndicators.crecimientoActivos },
  ];
  return specs.map((spec) => ({
    ...spec,
    ...difference(spec.empresa, spec.promedio),
  }));
}

function sectorResumen(codigo: SectorCodigo, companies: (CompanyRecord & { periodos: PeriodRow[] })[]): SectorResumen {
  const inSector = companies.filter((company) => company.sector === codigo);
  const ingresosAgregados = inSector.reduce((sum, company) => sum + (latestAmounts(company.periodos)?.revenue ?? 0), 0);
  const empleados = inSector.reduce((sum, company) => {
    const latest = latestAmounts(company.periodos);
    return sum + (company.numeroEmpleados ?? latest?.employees ?? 0);
  }, 0);
  const growths = inSector.flatMap((company) => {
    const growth = indicatorsFor(company.periodos.map(toAmounts)).crecimientoIngresos;
    return growth === null ? [] : [growth];
  });
  return {
    codigo,
    slug: slugOf(codigo),
    nombre: SECTOR_LABEL[codigo],
    empresas: inSector.length,
    ingresosAgregados,
    empleados,
    crecimientoPromedio: growths.length === 0 ? null : growths.reduce((sum, value) => sum + value, 0) / growths.length,
  };
}

function sectorSentence(nombre: string, companies: CompanyRecord[]): string {
  if (companies.length === 0) {
    return `${nombre} reúne 0 empresas.`;
  }
  const municipio = countBy(companies.map((company) => company.municipio))[0]?.label;
  const ciiu = countBy(companies.map((company) => company.actividadEconomicaCodigo))[0]?.label;
  return `${nombre} reúne ${companies.length} empresas. El municipio más frecuente es ${municipio}. El CIIU más frecuente es ${ciiu}.`;
}

function slugOf(codigo: SectorCodigo): string {
  return Object.entries(SLUG_SECTOR).find(([, value]) => value === codigo)?.[0] ?? codigo.toLowerCase();
}

function toComparador(company: CompanyRecord & { periodos: PeriodRow[] }): ComparadorColumna {
  const periods = sortPeriods(company.periodos.map(toAmounts));
  const current = periods.at(-1) ?? null;
  const previous = periods.length >= 2 ? periods.at(-2) ?? null : null;
  const indicators = current ? indicatorsBetween(current, previous) : indicatorsFor([]);
  return {
    id: company.id,
    razonSocial: company.razonSocial,
    nit: company.nit,
    sector: company.sector,
    ciudad: company.municipio,
    antiguedad: formatAntiguedad(company.fechaConstitucion?.toISOString() ?? null),
    empleados: current?.employees ?? company.numeroEmpleados,
    ingresos: current?.revenue ?? null,
    ebitda: current?.ebitda ?? null,
    utilidad: current?.netProfit ?? null,
    activos: current?.totalAssets ?? null,
    patrimonio: current?.equity ?? null,
    margenNeto: indicators.margenNeto,
    roe: indicators.roe,
    crecimientoIngresos: indicators.crecimientoIngresos,
    anio: current?.year ?? null,
  };
}

const ORGANIZATION_LISTS = [
  { tipo: "CLIENTES_ESTRATEGICOS" as const, nombre: LISTA_LABEL.CLIENTES_ESTRATEGICOS },
  { tipo: "PROSPECTOS" as const, nombre: LISTA_LABEL.PROSPECTOS },
  { tipo: "PROVEEDORES" as const, nombre: LISTA_LABEL.PROVEEDORES },
  { tipo: "TECNOLOGIA" as const, nombre: LISTA_LABEL.TECNOLOGIA },
];

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
      this.db.company.findMany({ include: { periodos: true } }),
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
      if (filters.sector && company.sector !== filters.sector) {
        return false;
      }
      if (filters.departamento && company.departamento !== filters.departamento) {
        return false;
      }
      if (filters.tamanoEmpresa && company.tamanoEmpresa !== filters.tamanoEmpresa) {
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
      if (filters.sector && company.sector !== filters.sector) {
        return false;
      }
      if (filters.departamento && company.departamento !== filters.departamento) {
        return false;
      }
      if (filters.tamanoEmpresa && company.tamanoEmpresa !== filters.tamanoEmpresa) {
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
    const growths = population.flatMap((company) => {
      const growth = indicatorsFor(company.periodos.map(toAmounts)).crecimientoIngresos;
      return growth === null ? [] : [growth];
    });
    const ingresosAgregados = population.reduce((sum, company) => sum + (latestAmounts(company.periodos)?.revenue ?? 0), 0);
    return {
      kpis: {
        disponibles: population.length,
        consultadas: consulted.size,
        monitoreadas: monitoredCompanies.size,
        alertasGeneradas: alertRows.length,
        mercantil: population.filter((company) => company.tipoRegistro === "MERCANTIL").length,
        esal: population.filter((company) => company.tipoRegistro === "ESAL").length,
        ingresosAgregados,
        crecimientoPromedio: growths.length === 0 ? null : growths.reduce((sum, value) => sum + value, 0) / growths.length,
      },
      empresasPorTipo: countBy(population.map((company) => REGISTRO_LABEL[company.tipoRegistro])),
      empresasPorEstado: countBy(population.map((company) => ESTADO_MATRICULA_LABEL[company.estadoMatricula])),
      empresasPorActividad: countBy(
        population.map((company) => `${company.actividadEconomicaCodigo} ${company.actividadEconomicaDescripcion}`),
      ),
      empresasPorSector: countBy(population.map((company) => SECTOR_LABEL[company.sector])),
      empresasPorDepartamento: countBy(population.map((company) => company.departamento)),
      empresasPorTamano: countBy(population.map((company) => TAMANO_LABEL[company.tamanoEmpresa])),
      alertasPorTipo: countBy(alertRows.map((alert) => EVENTO_LABEL[alert.tipo])),
      alertasPorCategoria: countBy(alertRows.map((alert) => CATEGORIA_LABEL[categoriaDeEvento(alert.tipo)])),
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
        departamentos: [...new Set(companies.map((company) => company.departamento))].sort((a, b) =>
          a.localeCompare(b, "es"),
        ),
        sectores: [...SECTOR_CODIGOS],
        tamanos: ["MICRO", "PEQUENA", "MEDIANA", "GRANDE"],
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

export class SqliteWatchlistRepository implements WatchlistRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(userId: string): Promise<WatchlistItem[]> {
    const existing = await this.db.watchlist.findMany({ where: { userId } });
    for (const list of ORGANIZATION_LISTS) {
      if (!existing.some((item) => item.tipo === list.tipo)) {
        await this.db.watchlist.create({ data: { userId, nombre: list.nombre, tipo: list.tipo } });
      }
    }
    const rows = await this.db.watchlist.findMany({
      where: { userId },
      include: { empresas: { include: { company: true } } },
      orderBy: { createdAt: "asc" },
    });
    const rank = new Map<string, number>(ORGANIZATION_LISTS.map((item, index) => [item.tipo, index]));
    return rows
      .sort((left, right) => (rank.get(left.tipo) ?? 99) - (rank.get(right.tipo) ?? 99))
      .map((row) => ({
        id: row.id,
        nombre: row.nombre,
        tipo: row.tipo,
        empresas: row.empresas
          .map((item) => ({
            id: item.company.id,
            razonSocial: item.company.razonSocial,
            nit: item.company.nit,
            sector: item.company.sector,
          }))
          .sort((left, right) => left.razonSocial.localeCompare(right.razonSocial, "es")),
      }));
  }

  async add(userId: string, watchlistId: string, companyId: string) {
    const list = await this.db.watchlist.findFirst({ where: { id: watchlistId, userId } });
    if (!list) {
      return "missing-list" as const;
    }
    const company = await this.db.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!company) {
      return "missing-company" as const;
    }
    const current = await this.db.watchlistItem.findUnique({
      where: { watchlistId_companyId: { watchlistId, companyId } },
    });
    if (current) {
      return "exists" as const;
    }
    await this.db.watchlistItem.create({ data: { watchlistId, companyId } });
    return "created" as const;
  }

  async remove(userId: string, watchlistId: string, companyId: string) {
    const list = await this.db.watchlist.findFirst({ where: { id: watchlistId, userId } });
    if (!list) {
      return false;
    }
    const current = await this.db.watchlistItem.findUnique({
      where: { watchlistId_companyId: { watchlistId, companyId } },
    });
    if (!current) {
      return false;
    }
    await this.db.watchlistItem.delete({ where: { id: current.id } });
    return true;
  }
}

export class SqliteSavedSearchRepository implements SavedSearchRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(userId: string): Promise<SavedSearchItem[]> {
    const rows = await this.db.savedSearch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      filtros: (row.filtros ?? {}) as CompanyFilters,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async create(userId: string, nombre: string, filtros: CompanyFilters) {
    const count = await this.db.savedSearch.count({ where: { userId } });
    if (count >= 20) {
      return "limit" as const;
    }
    const row = await this.db.savedSearch.create({
      data: { userId, nombre, filtros: filtros as Prisma.InputJsonValue },
    });
    return {
      id: row.id,
      nombre: row.nombre,
      filtros,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async remove(userId: string, id: string) {
    const current = await this.db.savedSearch.findFirst({ where: { id, userId } });
    if (!current) {
      return false;
    }
    await this.db.savedSearch.delete({ where: { id } });
    return true;
  }
}
