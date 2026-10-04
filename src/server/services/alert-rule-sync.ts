import type { Prisma, PrismaClient } from "@prisma/client";

import { evaluateDemoRules } from "@/server/services/alert-rules";
import { alertRuleEvaluator, draftFromEvaluation, snapshotFromPeriods, type EvaluableRule } from "@/server/services/alert-rule-evaluator";
import type { PeriodAmounts } from "@/server/services/financial-indicators";
import { fieldById, type RuleCategory, type RuleOperator } from "@/shared/utils/alert-rule-catalog";
import { AppError } from "@/server/errors";

const ruleSelect = {
  id: true,
  nombre: true,
  descripcion: true,
  categoria: true,
  tipoEvento: true,
  campoObservado: true,
  condicion: true,
  valorReferencia: true,
  severidad: true,
  activa: true,
  alcance: true,
  esDemostrativa: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
} satisfies Prisma.AlertRuleSelect;

type RuleRow = Prisma.AlertRuleGetPayload<{ select: typeof ruleSelect }>;

export interface RuleInput {
  nombre: string;
  descripcion: string;
  categoria: RuleCategory;
  campoObservado: string;
  condicion: RuleOperator;
  valorReferencia?: string | null;
  severidad: "INFORMATIVA" | "ATENCION" | "IMPORTANTE";
  activa: boolean;
  alcance: "TODAS" | "MONITOREADAS";
}

function asRule(row: RuleRow): EvaluableRule {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    campoObservado: row.campoObservado,
    condicion: row.condicion,
    valorReferencia: row.valorReferencia,
    severidad: row.severidad,
    tipoEvento: row.tipoEvento,
  };
}

function money(value: Prisma.Decimal | null): number | null {
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function assertRule(input: RuleInput) {
  const field = fieldById(input.categoria, input.campoObservado);
  if (!field) {
    throw new AppError("El campo no corresponde a la categoría.", 400, "VALIDATION");
  }
  if (input.condicion !== "CAMBIO" && !input.valorReferencia?.trim()) {
    throw new AppError("Indica el valor de la condición.", 400, "VALIDATION");
  }
  return field;
}

export async function syncRuleAlerts(db: PrismaClient, ruleId: string) {
  const rule = await db.alertRule.findUnique({ where: { id: ruleId }, select: ruleSelect });
  if (!rule) return;
  if (!rule.activa) {
    await db.alert.deleteMany({ where: { ruleId, tipo: "INDICADOR" } });
    return;
  }
  const companies = await db.company.findMany({
    include: {
      periodos: true,
      eventos: true,
      monitoreos: { select: { id: true } },
    },
  });
  const evaluable = asRule(rule);
  const financialIds: string[] = [];
  for (const company of companies) {
    if (rule.alcance === "MONITOREADAS" && company.monitoreos.length === 0) continue;
    const periods: PeriodAmounts[] = company.periodos.map((period) => ({
      year: period.year,
      cutoffDate: period.cutoffDate.toISOString().slice(0, 10),
      revenue: money(period.revenue) ?? 0,
      ebitda: money(period.ebitda) ?? 0,
      operatingProfit: money(period.operatingProfit) ?? 0,
      interestExpense: money(period.interestExpense) ?? 0,
      netProfit: money(period.netProfit) ?? 0,
      totalAssets: money(period.totalAssets) ?? 0,
      totalLiabilities: money(period.totalLiabilities) ?? 0,
      equity: money(period.equity) ?? 0,
      employees: period.employees,
      currentAssets: money(period.currentAssets),
      currentLiabilities: money(period.currentLiabilities),
      fuenteDatos: period.fuenteDatos,
    }));
    const latestEvent = [...company.eventos].reverse().find((event) => event.tipo === rule.tipoEvento);
    const metadata = latestEvent?.metadata as { valorAnterior?: string; valorNuevo?: string } | null;
    const snapshot = snapshotFromPeriods(company.id, company.razonSocial, periods, {
      [rule.campoObservado]: {
        previous: metadata?.valorAnterior ?? null,
        current: metadata?.valorNuevo ?? null,
      },
    });
    if (rule.tipoEvento === "INDICADOR") {
      const result = alertRuleEvaluator.evaluate(evaluable, snapshot);
      const id = `alert-fin-${rule.id}-${company.id}`;
      if (!result.cumple) continue;
      financialIds.push(company.id);
      const fecha = periods.at(-1)?.cutoffDate ?? new Date().toISOString().slice(0, 10);
      await db.alert.upsert({
        where: { id },
        create: {
          id,
          companyId: company.id,
          ruleId: rule.id,
          tipo: "INDICADOR",
          titulo: rule.nombre,
          descripcion: result.mensaje,
          severidad: rule.severidad,
          fecha: new Date(`${fecha}T12:00:00.000Z`),
          leida: false,
          metadata: { valorAnterior: null, valorNuevo: result.valorDetectado, regla: rule.campoObservado },
        },
        update: {
          titulo: rule.nombre,
          descripcion: result.mensaje,
          severidad: rule.severidad,
          metadata: { valorAnterior: null, valorNuevo: result.valorDetectado, regla: rule.campoObservado },
        },
      });
      continue;
    }
    const drafts = evaluateDemoRules(
      {
        id: latestEvent?.id ?? `sin-evento-${company.id}`,
        companyId: company.id,
        tipo: rule.tipoEvento,
        fecha: latestEvent?.fecha.toISOString() ?? new Date().toISOString(),
        titulo: latestEvent?.titulo ?? rule.nombre,
        descripcion: latestEvent?.descripcion ?? rule.descripcion,
        metadata: metadata ?? null,
      },
      [{ ...evaluable, activa: rule.activa }],
    );
    for (const draft of drafts) {
      await db.alert.upsert({
        where: { id: draft.id },
        create: {
          id: draft.id,
          companyId: draft.companyId,
          ruleId: draft.ruleId,
          tipo: rule.tipoEvento,
          titulo: draft.titulo,
          descripcion: draft.descripcion,
          severidad: draft.severidad,
          fecha: new Date(draft.fecha),
          metadata: { ...draft.metadata },
        },
        update: {
          titulo: draft.titulo,
          descripcion: draft.descripcion,
          severidad: draft.severidad,
        },
      });
    }
  }
  if (rule.tipoEvento === "INDICADOR") {
    await db.alert.deleteMany({
      where: { ruleId, tipo: "INDICADOR", ...(financialIds.length > 0 ? { companyId: { notIn: financialIds } } : {}) },
    });
  }
}

export async function previewRule(db: PrismaClient, input: RuleInput, companyId: string) {
  const field = assertRule(input);
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: { periodos: true, eventos: true },
  });
  if (!company) throw new AppError("La empresa no existe.", 404, "NOT_FOUND");
  const periods: PeriodAmounts[] = company.periodos.map((period) => ({
    year: period.year,
    cutoffDate: period.cutoffDate.toISOString().slice(0, 10),
    revenue: money(period.revenue) ?? 0,
    ebitda: money(period.ebitda) ?? 0,
    operatingProfit: money(period.operatingProfit) ?? 0,
    interestExpense: money(period.interestExpense) ?? 0,
    netProfit: money(period.netProfit) ?? 0,
    totalAssets: money(period.totalAssets) ?? 0,
    totalLiabilities: money(period.totalLiabilities) ?? 0,
    equity: money(period.equity) ?? 0,
    employees: period.employees,
    currentAssets: money(period.currentAssets),
    currentLiabilities: money(period.currentLiabilities),
    fuenteDatos: period.fuenteDatos,
  }));
  const latestEvent = [...company.eventos].reverse().find((event) => event.tipo === field.tipoEvento);
  const metadata = latestEvent?.metadata as { valorAnterior?: string; valorNuevo?: string } | null;
  const snapshot = snapshotFromPeriods(company.id, company.razonSocial, periods, {
    [input.campoObservado]: { previous: metadata?.valorAnterior ?? null, current: metadata?.valorNuevo ?? null },
  });
  const rule: EvaluableRule = {
    id: "preview",
    nombre: input.nombre,
    categoria: input.categoria,
    campoObservado: input.campoObservado,
    condicion: input.condicion,
    valorReferencia: input.valorReferencia ?? null,
    severidad: input.severidad,
    tipoEvento: field.tipoEvento,
  };
  const result = alertRuleEvaluator.evaluate(rule, snapshot);
  const draft = draftFromEvaluation(rule, snapshot, periods.at(-1)?.cutoffDate ?? "2025-12-31");
  return { ...result, alerta: draft?.titulo ?? null };
}
