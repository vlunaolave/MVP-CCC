export interface RuleInput {
  id: string;
  nombre: string;
  tipoEvento: string;
  campoObservado: string;
  condicion: "CAMBIO" | "IGUAL_A" | "DISTINTO_DE" | "MAYOR_QUE" | "MENOR_QUE" | "MAYOR_IGUAL" | "MENOR_IGUAL" | "VARIACION_MAYOR" | "VARIACION_MENOR";
  valorReferencia: string | null;
  severidad: "INFORMATIVA" | "ATENCION" | "IMPORTANTE";
  activa: boolean;
}

export interface EventInput {
  id: string;
  companyId: string;
  tipo: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  metadata?: { valorAnterior?: string | null; valorNuevo?: string | null } | null;
}

export interface AlertDraft {
  id: string;
  companyId: string;
  ruleId: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  severidad: "INFORMATIVA" | "ATENCION" | "IMPORTANTE";
  fecha: string;
  metadata: { valorAnterior: string | null; valorNuevo: string | null; regla: string };
}

function asText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return String(value);
}

export function evaluateDemoRules(event: EventInput, rules: RuleInput[]): AlertDraft[] {
  const previous = asText(event.metadata?.valorAnterior);
  const next = asText(event.metadata?.valorNuevo);
  const drafts: AlertDraft[] = [];

  for (const rule of rules) {
    if (!rule.activa || rule.tipoEvento !== event.tipo) {
      continue;
    }
    let matches = false;
    if (rule.condicion === "CAMBIO") {
      matches = previous !== null && next !== null && previous !== next;
    } else if (rule.condicion === "IGUAL_A") {
      matches = next !== null && rule.valorReferencia !== null && next === rule.valorReferencia;
    } else if (rule.condicion === "DISTINTO_DE") {
      matches = next !== null && rule.valorReferencia !== null && next !== rule.valorReferencia;
    }
    if (!matches) {
      continue;
    }
    drafts.push({
      id: `alert-${event.id}-${rule.id}`,
      companyId: event.companyId,
      ruleId: rule.id,
      tipo: event.tipo,
      titulo: rule.nombre,
      descripcion: event.descripcion,
      severidad: rule.severidad,
      fecha: event.fecha,
      metadata: {
        valorAnterior: previous,
        valorNuevo: next,
        regla: rule.campoObservado,
      },
    });
  }

  return drafts;
}
