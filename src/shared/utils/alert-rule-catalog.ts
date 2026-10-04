export const RULE_CATEGORIES = [
  { id: "REGISTRAL", label: "Registral" },
  { id: "FINANCIERA", label: "Financiera" },
  { id: "PROPIEDAD", label: "Propiedad" },
  { id: "DIRECTIVOS", label: "Directivos" },
  { id: "ACTIVIDAD", label: "Actividad económica" },
  { id: "UBICACION", label: "Ubicación" },
] as const;

export const RULE_OPERATORS = [
  { id: "CAMBIO", label: "Cambió" },
  { id: "IGUAL_A", label: "Igual a" },
  { id: "DISTINTO_DE", label: "Diferente de" },
  { id: "MAYOR_QUE", label: "Mayor que" },
  { id: "MENOR_QUE", label: "Menor que" },
  { id: "MAYOR_IGUAL", label: "Mayor o igual" },
  { id: "MENOR_IGUAL", label: "Menor o igual" },
  { id: "VARIACION_MAYOR", label: "Variación mayor que %" },
  { id: "VARIACION_MENOR", label: "Variación menor que %" },
] as const;

export type RuleCategory = (typeof RULE_CATEGORIES)[number]["id"];
export type RuleOperator = (typeof RULE_OPERATORS)[number]["id"];
export type FieldKind = "text" | "money" | "percent" | "times" | "number";

export interface RuleField {
  id: string;
  label: string;
  kind: FieldKind;
  tipoEvento: string;
}

export const RULE_FIELDS: Record<RuleCategory, RuleField[]> = {
  REGISTRAL: [
    { id: "representanteLegal", label: "Representante legal", kind: "text", tipoEvento: "CAMBIO_REPRESENTANTE" },
    { id: "estadoMatricula", label: "Estado de matrícula", kind: "text", tipoEvento: "CAMBIO_ESTADO_MATRICULA" },
    { id: "fechaRenovacion", label: "Renovación de matrícula", kind: "text", tipoEvento: "RENOVACION" },
    { id: "tipoOrganizacion", label: "Tipo de organización", kind: "text", tipoEvento: "CAMBIO_TIPO_ORGANIZACION" },
  ],
  FINANCIERA: [
    { id: "ingresos", label: "Ingresos", kind: "money", tipoEvento: "INDICADOR" },
    { id: "nivelEndeudamiento", label: "Nivel de endeudamiento", kind: "percent", tipoEvento: "INDICADOR" },
    { id: "razonCorriente", label: "Razón corriente", kind: "times", tipoEvento: "INDICADOR" },
    { id: "patrimonio", label: "Patrimonio", kind: "money", tipoEvento: "INDICADOR" },
    { id: "activos", label: "Activos", kind: "money", tipoEvento: "INDICADOR" },
  ],
  PROPIEDAD: [{ id: "participacion", label: "Participación de accionista", kind: "text", tipoEvento: "CAMBIO_PARTICIPACION" }],
  DIRECTIVOS: [{ id: "representanteLegal", label: "Representante legal", kind: "text", tipoEvento: "CAMBIO_REPRESENTANTE" }],
  ACTIVIDAD: [{ id: "actividadEconomicaCodigo", label: "Actividad económica", kind: "text", tipoEvento: "MODIFICACION_ACTIVIDAD" }],
  UBICACION: [{ id: "direccion", label: "Dirección", kind: "text", tipoEvento: "CAMBIO_DOMICILIO" }],
};

export function fieldById(category: RuleCategory, fieldId: string): RuleField | undefined {
  return RULE_FIELDS[category].find((field) => field.id === fieldId);
}

export function operatorLabel(id: string): string {
  return RULE_OPERATORS.find((item) => item.id === id)?.label ?? id;
}

export function categoryLabel(id: string): string {
  return RULE_CATEGORIES.find((item) => item.id === id)?.label ?? id;
}
