import type {
  EstadoJuridico,
  EstadoMatricula,
  RolCodigo,
  Severidad,
  TamanoEmpresa,
  TipoEvento,
  TipoRegistro,
  TipoRelacion,
} from "@/shared/types/domain";

export const ESTADO_MATRICULA_LABEL: Record<EstadoMatricula, string> = {
  ACTIVA: "Activa",
  SUSPENDIDA: "Suspendida",
  CANCELADA: "Cancelada",
  INACTIVA: "Inactiva",
};

export const ESTADO_JURIDICO_LABEL: Record<EstadoJuridico, string> = {
  VIGENTE: "Vigente",
  EN_LIQUIDACION: "En liquidación",
  DISUELTA: "Disuelta",
  INACTIVA: "Inactiva",
};

export const TAMANO_LABEL: Record<TamanoEmpresa, string> = {
  MICRO: "Micro",
  PEQUENA: "Pequeña",
  MEDIANA: "Mediana",
  GRANDE: "Grande",
};

export const REGISTRO_LABEL: Record<TipoRegistro, string> = {
  MERCANTIL: "Registro Mercantil",
  ESAL: "ESAL",
};

export const SEVERIDAD_LABEL: Record<Severidad, string> = {
  INFORMATIVA: "Informativa",
  ATENCION: "Atención",
  IMPORTANTE: "Importante",
};

export const ROL_LABEL: Record<RolCodigo, string> = {
  ADMINISTRADOR: "Administrador",
  ANALISTA: "Analista",
  CONSULTOR: "Consultor",
};

export const RELACION_LABEL: Record<TipoRelacion, string> = {
  REPRESENTANTE_LEGAL: "Representante legal",
  SOCIO: "Socio",
  ESTABLECIMIENTO: "Establecimiento",
  PERSONA_OTRA_EMPRESA: "Persona en otra empresa",
  EMPRESA_RELACIONADA: "Empresa relacionada",
};

export const EVENTO_LABEL: Record<TipoEvento, string> = {
  CONSTITUCION: "Constitución",
  MATRICULA: "Matrícula",
  RENOVACION: "Renovación",
  CAMBIO_REPRESENTANTE: "Cambio de representante",
  CAMBIO_DOMICILIO: "Cambio de domicilio",
  MODIFICACION_ACTIVIDAD: "Modificación de actividad",
  CAMBIO_ESTADO_MATRICULA: "Cambio de estado de matrícula",
  CAMBIO_TIPO_ORGANIZACION: "Cambio de tipo de organización",
  APERTURA_ESTABLECIMIENTO: "Apertura de establecimiento",
  OTRO_REGISTRAL: "Otro acto registral",
};

export function formatMoney(value: number | null): string {
  if (value === null) {
    return "Sin información";
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
