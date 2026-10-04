import bcrypt from "bcryptjs";

import { permissionCatalog, roleCatalog } from "./data/users";
import { DemoDataSourceAdapter } from "../src/server/adapters/data-source";
import { evaluateDemoRules } from "../src/server/services/alert-rules";
import { assertRelationIntegrity } from "../src/server/services/relation-integrity";
import { prisma } from "../src/shared/lib/prisma";
import { ROLE_PERMISSIONS } from "../src/shared/lib/permissions";
import { dateOnly } from "../src/shared/utils/dates";

function latestDate(dates: string[], fallback: string): Date {
  const sorted = [...dates].sort();
  return dateOnly(sorted[sorted.length - 1] ?? fallback);
}

async function main() {
  const dataset = await new DemoDataSourceAdapter().loadReferenceData();
  assertRelationIntegrity(dataset.relations);
  const drafts = dataset.events.flatMap((event) => evaluateDemoRules(event, dataset.alertRules));

  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.monitoredCompany.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.companyRelation.deleteMany();
  await prisma.establishment.deleteMany();
  await prisma.companyUnspscClassification.deleteMany();
  await prisma.companyFinancialPeriod.deleteMany();
  await prisma.person.deleteMany();
  await prisma.company.deleteMany();
  await prisma.sectorBenchmark.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.session.deleteMany();
  await prisma.authIdentity.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.appSetting.deleteMany();

  for (const role of roleCatalog) {
    await prisma.role.create({ data: role });
  }
  for (const permission of permissionCatalog) {
    await prisma.permission.create({ data: permission });
  }
  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  for (const role of roles) {
    const codes = ROLE_PERMISSIONS[role.codigo];
    for (const code of codes) {
      const permission = permissions.find((item) => item.codigo === code);
      if (!permission) {
        throw new Error(`Permiso no sembrado: ${code}`);
      }
      await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
    }
  }

  for (const company of dataset.companies) {
    const companyEvents = dataset.events.filter((event) => event.companyId === company.id).map((event) => event.fecha);
    await prisma.company.create({
      data: {
        id: company.id,
        nit: company.nit,
        razonSocial: company.razonSocial,
        nombreComercial: company.nombreComercial,
        tipoOrganizacion: company.tipoOrganizacion,
        tipoRegistro: company.tipoRegistro,
        estadoMatricula: company.estadoMatricula,
        numeroMatricula: company.numeroMatricula,
        fechaMatricula: dateOnly(company.fechaMatricula),
        fechaRenovacion: company.fechaRenovacion ? dateOnly(company.fechaRenovacion) : null,
        camaraComercio: company.camaraComercio,
        municipio: company.municipio,
        departamento: company.departamento,
        direccion: company.direccion,
        telefono: company.telefono,
        email: company.email,
        sitioWeb: company.sitioWeb,
        actividadEconomicaCodigo: company.actividadEconomicaCodigo,
        actividadEconomicaDescripcion: company.actividadEconomicaDescripcion,
        tamanoEmpresa: company.tamanoEmpresa,
        numeroEmpleados: company.numeroEmpleados,
        capital: company.capital,
        activos: company.activos,
        fechaConstitucion: company.fechaConstitucion ? dateOnly(company.fechaConstitucion) : null,
        estado: company.estado,
        representanteLegal: company.representanteLegal,
        fechaUltimaActualizacion: latestDate(companyEvents, company.fechaMatricula),
        sector: company.sector,
        fuenteDatos: company.fuenteDatos,
      },
    });
  }

  for (const person of dataset.people) {
    await prisma.person.create({ data: person });
  }
  for (const establishment of dataset.establishments) {
    await prisma.establishment.create({ data: establishment });
  }
  for (const relation of dataset.relations) {
    await prisma.companyRelation.create({
      data: {
        id: relation.id,
        companyId: relation.companyId,
        tipo: relation.tipo,
        personId: relation.personId,
        relatedCompanyId: relation.relatedCompanyId,
        establishmentId: relation.establishmentId,
        descripcion: relation.descripcion,
        cargo: relation.cargo,
        porcentajeParticipacion: relation.porcentajeParticipacion,
        fechaInicio: dateOnly(relation.fechaInicio),
        fechaFin: relation.fechaFin ? dateOnly(relation.fechaFin) : null,
        vigente: relation.vigente,
      },
    });
  }
  for (const event of dataset.events) {
    await prisma.timelineEvent.create({
      data: {
        id: event.id,
        companyId: event.companyId,
        tipo: event.tipo,
        categoria: event.categoria,
        fecha: dateOnly(event.fecha),
        titulo: event.titulo,
        descripcion: event.descripcion,
        fuente: event.fuente,
        metadata: event.metadata ? { ...event.metadata } : undefined,
      },
    });
  }
  for (const period of dataset.financials) {
    await prisma.companyFinancialPeriod.create({
      data: {
        id: period.id,
        companyId: period.companyId,
        year: period.year,
        revenue: period.revenue,
        ebitda: period.ebitda,
        netProfit: period.netProfit,
        totalAssets: period.totalAssets,
        totalLiabilities: period.totalLiabilities,
        equity: period.equity,
        employees: period.employees,
        currentAssets: period.currentAssets,
        currentLiabilities: period.currentLiabilities,
        operatingProfit: period.operatingProfit,
        interestExpense: period.interestExpense,
        cutoffDate: dateOnly(period.cutoffDate),
        fuenteDatos: "DEMO",
      },
    });
  }
  for (const item of dataset.unspsc) {
    await prisma.companyUnspscClassification.create({ data: item });
  }
  for (const benchmark of dataset.benchmarks) {
    await prisma.sectorBenchmark.create({ data: { ...benchmark, fuenteDatos: "DEMO" } });
  }
  for (const rule of dataset.alertRules) {
    await prisma.alertRule.create({ data: rule });
  }
  for (const draft of drafts) {
    await prisma.alert.create({
      data: {
        id: draft.id,
        companyId: draft.companyId,
        ruleId: draft.ruleId,
        tipo: draft.tipo as never,
        titulo: draft.titulo,
        descripcion: draft.descripcion,
        severidad: draft.severidad,
        fecha: dateOnly(draft.fecha),
        leida: false,
        metadata: { ...draft.metadata },
      },
    });
  }

  const userIds = new Map<string, string>();
  for (const user of dataset.users) {
    const created = await prisma.user.create({
      data: {
        email: user.email,
        nombre: user.nombre,
        passwordHash: await bcrypt.hash(user.password, 10),
        rol: user.rol,
        activo: user.activo,
      },
    });
    userIds.set(user.email, created.id);
    await prisma.authIdentity.create({
      data: { userId: created.id, proveedor: "LOCAL", subject: created.id },
    });
  }

  for (const list of dataset.watchlists) {
    const userId = userIds.get(list.userEmail);
    if (!userId) {
      throw new Error(`Usuario de lista desconocido: ${list.userEmail}`);
    }
    await prisma.watchlist.create({
      data: {
        id: list.id,
        userId,
        nombre: list.nombre,
        tipo: list.tipo,
        empresas: {
          create: list.companyIds.map((companyId) => ({ companyId })),
        },
      },
    });
  }
  for (const item of dataset.monitoring) {
    const userId = userIds.get(item.userEmail);
    if (!userId) {
      throw new Error(`Usuario de monitoreo desconocido: ${item.userEmail}`);
    }
    await prisma.monitoredCompany.create({
      data: { userId, companyId: item.companyId, fechaInicio: dateOnly(item.fechaInicio) },
    });
  }
  for (const item of dataset.initialAudit) {
    const userId = userIds.get(item.userEmail);
    if (!userId) {
      throw new Error(`Usuario de auditoría desconocido: ${item.userEmail}`);
    }
    await prisma.auditLog.create({
      data: {
        userId,
        accion: "CONSULTA_EMPRESA",
        entidad: "Company",
        entidadId: item.companyId,
        fecha: dateOnly(item.fecha),
      },
    });
  }
  for (const setting of dataset.settings) {
    await prisma.appSetting.create({ data: setting });
  }

  const innovaAlerts = drafts.filter((draft) => draft.companyId === "co-innova").length;
  console.log(
    JSON.stringify(
      {
        empresas: dataset.companies.length,
        personas: dataset.people.length,
        eventos: dataset.events.length,
        alertas: drafts.length,
        alertasInnova: innovaAlerts,
        reglas: dataset.alertRules.length,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
