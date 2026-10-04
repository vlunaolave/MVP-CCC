import type {
  CategoriaTimeline,
  EstadoJuridico,
  EstadoMatricula,
  RolCodigo,
  SectorCodigo,
  Severidad,
  TamanoEmpresa,
  TipoEvento,
  TipoLista,
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

export const SECTOR_LABEL: Record<SectorCodigo, string> = {
  TECNOLOGIA: "Tecnología",
  COMERCIO: "Comercio",
  CONSTRUCCION: "Construcción",
  SERVICIOS: "Servicios",
  INDUSTRIA: "Industria",
  TRANSPORTE: "Transporte",
  SALUD: "Salud",
};

export const SECTOR_SLUG: Record<SectorCodigo, string> = {
  TECNOLOGIA: "tecnologia",
  COMERCIO: "comercio",
  CONSTRUCCION: "construccion",
  SERVICIOS: "servicios",
  INDUSTRIA: "industria",
  TRANSPORTE: "transporte",
  SALUD: "salud",
};

export const SLUG_SECTOR: Record<string, SectorCodigo> = {
  tecnologia: "TECNOLOGIA",
  comercio: "COMERCIO",
  construccion: "CONSTRUCCION",
  servicios: "SERVICIOS",
  industria: "INDUSTRIA",
  transporte: "TRANSPORTE",
  salud: "SALUD",
};

export const CATEGORIA_LABEL: Record<CategoriaTimeline, string> = {
  REGISTRAL: "Registrales",
  CORPORATIVO: "Corporativos",
  FINANCIERO: "Financieros",
  NOTICIA: "Noticias",
  ALERTA: "Alertas",
};

export const LISTA_LABEL: Record<TipoLista, string> = {
  CLIENTES_ESTRATEGICOS: "Clientes estratégicos",
  PROSPECTOS: "Prospectos",
  PROVEEDORES: "Proveedores",
  TECNOLOGIA: "Empresas de tecnología",
  PERSONAL: "Personal",
};

export const RELACION_LABEL: Record<TipoRelacion, string> = {
  REPRESENTANTE_LEGAL: "Representante legal",
  SOCIO: "Socio",
  ESTABLECIMIENTO: "Establecimiento",
  PERSONA_OTRA_EMPRESA: "Persona en otra empresa",
  EMPRESA_RELACIONADA: "Empresa relacionada",
  SUPLENTE: "Suplente",
  MIEMBRO_JUNTA: "Junta directiva",
  REVISOR_FISCAL: "Revisor fiscal",
  OTRO_CARGO: "Otro cargo",
  MATRIZ: "Matriz",
  SUBSIDIARIA: "Subsidiaria",
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
  NOTICIA: "Noticia",
  NOMBRAMIENTO: "Nombramiento",
  CAMBIO_PARTICIPACION: "Cambio de participación",
};

export { formatCOP as formatMoney } from "@/shared/utils/format";
