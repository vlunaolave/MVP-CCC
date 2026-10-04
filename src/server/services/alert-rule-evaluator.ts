import type { AlertDraft } from "@/server/services/alert-rules";
import { fieldById, operatorLabel, type RuleCategory, type RuleOperator } from "@/shared/utils/alert-rule-catalog";
import { formatCOP, formatPercentage, formatTimes } from "@/shared/utils/format";
import { indicatorsBetween, sortPeriods, type PeriodAmounts } from "@/server/services/financial-indicators";

export interface EvaluableRule {
  id: string;
  nombre: string;
  categoria: RuleCategory;
  campoObservado: string;
  condicion: RuleOperator;
  valorReferencia: string | null;
  severidad: "INFORMATIVA" | "ATENCION" | "IMPORTANTE";
  tipoEvento: string;
}

export interface ValuePair {
  previous: number | string | null;
  current: number | string | null;
}

export interface CompanySnapshot {
  companyId: string;
  razonSocial: string;
  values: Record<string, ValuePair>;
}

export interface RuleEvaluation {
  cumple: boolean;
  valorDetectado: string;
  mensaje: string;
}

const NUMERIC = new Set<RuleOperator>(["MAYOR_QUE", "MENOR_QUE", "MAYOR_IGUAL", "MENOR_IGUAL", "VARIACION_MAYOR", "VARIACION_MENOR"]);

export class AlertRuleEvaluator {
  evaluate(rule: EvaluableRule, company: CompanySnapshot): RuleEvaluation {
    const pair = company.values[rule.campoObservado] ?? { previous: null, current: null };
    const field = fieldById(rule.categoria, rule.campoObservado);
    const kind = field?.kind ?? "text";
    const detected = formatDetected(pair.current, kind);
    const condition = describeCondition(rule, kind);
    const cumple = matches(rule, pair);

    if (pair.current === null || pair.current === undefined || pair.current === "") {
      return {
        cumple: false,
        valorDetectado: "N/D",
        mensaje: `${company.razonSocial} no tiene información suficiente de ${field?.label ?? rule.campoObservado} para evaluar la regla.`,
      };
    }

    const mensaje = cumple
      ? `${company.razonSocial}: la regla se activaría. ${field?.label ?? rule.campoObservado} actual: ${detected}. Condición configurada: ${condition}.`
      : `${company.razonSocial} no cumple actualmente esta condición. ${field?.label ?? rule.campoObservado} actual: ${detected}. Condición configurada: ${condition}.`;

    return { cumple, valorDetectado: detected, mensaje };
  }
}

export const alertRuleEvaluator = new AlertRuleEvaluator();

function matches(rule: EvaluableRule, pair: ValuePair): boolean {
  if (NUMERIC.has(rule.condicion) || typeof pair.current === "number") {
    const current = typeof pair.current === "number" ? pair.current : Number(pair.current);
    const previous = typeof pair.previous === "number" ? pair.previous : pair.previous === null ? null : Number(pair.previous);
    const threshold = Number(String(rule.valorReferencia ?? "").replace(",", "."));
    if (!Number.isFinite(current)) {
      return false;
    }
    if (rule.condicion === "MAYOR_QUE") return Number.isFinite(threshold) && current > threshold;
    if (rule.condicion === "MENOR_QUE") return Number.isFinite(threshold) && current < threshold;
    if (rule.condicion === "MAYOR_IGUAL") return Number.isFinite(threshold) && current >= threshold;
    if (rule.condicion === "MENOR_IGUAL") return Number.isFinite(threshold) && current <= threshold;
    if (rule.condicion === "IGUAL_A") return Number.isFinite(threshold) && current === threshold;
    if (rule.condicion === "DISTINTO_DE") return Number.isFinite(threshold) && current !== threshold;
    if (!Number.isFinite(threshold) || previous === null || !Number.isFinite(previous) || previous === 0) {
      return false;
    }
    const change = (current - previous) / Math.abs(previous);
    const limit = threshold / 100;
    if (rule.condicion === "VARIACION_MAYOR") return change > limit;
    if (rule.condicion === "VARIACION_MENOR") return change < limit;
  }

  const current = pair.current === null || pair.current === undefined ? null : String(pair.current);
  const previous = pair.previous === null || pair.previous === undefined ? null : String(pair.previous);
  if (rule.condicion === "CAMBIO") return previous !== null && current !== null && previous !== current;
  if (rule.condicion === "IGUAL_A") return current !== null && current === rule.valorReferencia;
  if (rule.condicion === "DISTINTO_DE") return current !== null && rule.valorReferencia !== null && current !== rule.valorReferencia;
  return false;
}

function formatDetected(value: number | string | null, kind: string): string {
  if (value === null || value === undefined || value === "") return "N/D";
  if (typeof value === "number") {
    if (kind === "percent") return formatPercentage(value);
    if (kind === "times") return formatTimes(value);
    if (kind === "money") return formatCOP(value);
    return formatTimes(value);
  }
  return String(value);
}

function describeCondition(rule: EvaluableRule, kind: string): string {
  const operator = operatorLabel(rule.condicion).toLowerCase();
  if (!rule.valorReferencia) return operator;
  const numeric = Number(String(rule.valorReferencia).replace(",", "."));
  if (!Number.isFinite(numeric)) return `${operator} ${rule.valorReferencia}`;
  if (rule.condicion === "VARIACION_MAYOR" || rule.condicion === "VARIACION_MENOR") {
    return `${operator} ${formatPercentage(numeric / 100)}`;
  }
  if (kind === "percent") return `${operator} ${formatPercentage(numeric)}`;
  if (kind === "times") return `${operator} ${formatTimes(numeric)}`;
  if (kind === "money") return `${operator} ${formatCOP(numeric)}`;
  return `${operator} ${rule.valorReferencia}`;
}

export function draftFromEvaluation(rule: EvaluableRule, company: CompanySnapshot, fecha: string): AlertDraft | null {
  const result = alertRuleEvaluator.evaluate(rule, company);
  if (!result.cumple) return null;
  return {
    id: `alert-fin-${rule.id}-${company.companyId}`,
    companyId: company.companyId,
    ruleId: rule.id,
    tipo: rule.tipoEvento || "INDICADOR",
    titulo: rule.nombre,
    descripcion: result.mensaje,
    severidad: rule.severidad,
    fecha,
    metadata: {
      valorAnterior: null,
      valorNuevo: result.valorDetectado,
      regla: rule.campoObservado,
    },
  };
}

export function snapshotFromPeriods(companyId: string, razonSocial: string, periods: PeriodAmounts[], texts: Record<string, ValuePair> = {}): CompanySnapshot {
  const sorted = sortPeriods(periods);
  const current = sorted.at(-1) ?? null;
  const previous = sorted.length >= 2 ? sorted.at(-2) ?? null : null;
  const currentIndicators = current ? indicatorsBetween(current, previous) : null;
  const previousIndicators = previous ? indicatorsBetween(previous, sorted.length >= 3 ? sorted.at(-3) ?? null : null) : null;
  const values: Record<string, ValuePair> = { ...texts };
  if (current) {
    values.ingresos = { previous: previous?.revenue ?? null, current: current.revenue };
    values.patrimonio = { previous: previous?.equity ?? null, current: current.equity };
    values.activos = { previous: previous?.totalAssets ?? null, current: current.totalAssets };
    values.nivelEndeudamiento = { previous: previousIndicators?.nivelEndeudamiento ?? null, current: currentIndicators?.nivelEndeudamiento ?? null };
    values.razonCorriente = { previous: previousIndicators?.razonCorriente ?? null, current: currentIndicators?.razonCorriente ?? null };
  }
  return { companyId, razonSocial, values };
}
