export const ROL_CODIGOS = ["ADMINISTRADOR", "ANALISTA", "CONSULTOR"] as const;
export type RolCodigo = (typeof ROL_CODIGOS)[number];

export const PERMISSION_CODES = [
  "inicio.ver",
  "empresas.consultar",
  "empresas.perfil",
  "empresas.relaciones",
  "empresas.timeline",
  "empresas.grafo",
  "empresas.monitorear",
  "monitoreo.ver",
  "alertas.ver",
  "alertas.marcar_leida",
  "dashboard.ver",
  "admin.usuarios",
  "admin.roles",
  "admin.configuracion",
] as const;
export type PermissionCode = (typeof PERMISSION_CODES)[number];

export type TipoRegistro = "MERCANTIL" | "ESAL";
export type EstadoMatricula = "ACTIVA" | "SUSPENDIDA" | "CANCELADA" | "INACTIVA";
export type EstadoJuridico = "VIGENTE" | "EN_LIQUIDACION" | "DISUELTA" | "INACTIVA";
export type TamanoEmpresa = "MICRO" | "PEQUENA" | "MEDIANA" | "GRANDE";
export type Severidad = "INFORMATIVA" | "ATENCION" | "IMPORTANTE";
export type TipoRelacion =
  | "REPRESENTANTE_LEGAL"
  | "SOCIO"
  | "ESTABLECIMIENTO"
  | "PERSONA_OTRA_EMPRESA"
  | "EMPRESA_RELACIONADA";
export type TipoEvento =
  | "CONSTITUCION"
  | "MATRICULA"
  | "RENOVACION"
  | "CAMBIO_REPRESENTANTE"
  | "CAMBIO_DOMICILIO"
  | "MODIFICACION_ACTIVIDAD"
  | "CAMBIO_ESTADO_MATRICULA"
  | "CAMBIO_TIPO_ORGANIZACION"
  | "APERTURA_ESTABLECIMIENTO"
  | "OTRO_REGISTRAL";

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: RolCodigo;
  permisos: PermissionCode[];
  aviso: string;
  plataformaNombre: string;
}

export interface CompanyListItem {
  id: string;
  nit: string;
  razonSocial: string;
  nombreComercial: string | null;
  tipoRegistro: TipoRegistro;
  tipoOrganizacion: string;
  actividadEconomicaCodigo: string;
  actividadEconomicaDescripcion: string;
  municipio: string;
  departamento: string;
  estadoMatricula: EstadoMatricula;
  tamanoEmpresa: TamanoEmpresa;
  fechaUltimaActualizacion: string;
  monitoreada: boolean;
}

export interface CompanyProfile extends CompanyListItem {
  numeroMatricula: string;
  fechaMatricula: string;
  fechaRenovacion: string | null;
  camaraComercio: string;
  direccion: string;
  telefono: string | null;
  email: string | null;
  sitioWeb: string | null;
  numeroEmpleados: number | null;
  capital: number | null;
  activos: number | null;
  fechaConstitucion: string | null;
  estado: EstadoJuridico;
  representanteLegal: string | null;
  resumen: string;
  antiguedad: string | null;
  relaciones: RelationItem[] | null;
  timeline: TimelineItem[] | null;
  alertas: AlertItem[] | null;
}

export interface RelationItem {
  id: string;
  tipo: TipoRelacion;
  descripcion: string;
  porcentajeParticipacion: number | null;
  fechaInicio: string;
  fechaFin: string | null;
  vigente: boolean;
  persona: { id: string; nombre: string; tipoDocumento: string; numeroDocumento: string } | null;
  empresaRelacionada: { id: string; razonSocial: string; nit: string } | null;
  establecimiento: {
    id: string;
    nombre: string;
    direccion: string;
    municipio: string;
    estado: string;
  } | null;
}

export interface TimelineItem {
  id: string;
  tipo: TipoEvento;
  fecha: string;
  titulo: string;
  descripcion: string;
  fuente: string;
  metadata: { valorAnterior: string | null; valorNuevo: string | null } | null;
}

export interface AlertItem {
  id: string;
  companyId: string;
  razonSocial: string;
  nit: string;
  tipo: TipoEvento;
  titulo: string;
  descripcion: string;
  severidad: Severidad;
  fecha: string;
  leida: boolean;
}

export interface MonitoringItem {
  companyId: string;
  razonSocial: string;
  nit: string;
  nombreComercial: string | null;
  fechaInicio: string;
  fechaUltimaActualizacion: string;
  alertas: number;
  estadoMatricula: EstadoMatricula;
  municipio: string;
}

export interface GraphNode {
  id: string;
  type: "empresa" | "representante" | "socio" | "persona" | "establecimiento" | "relacionada";
  data: {
    titulo: string;
    subtitulo: string;
    campos: { etiqueta: string; valor: string }[];
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DashboardPayload {
  kpis: {
    consultadas: number;
    monitoreadas: number;
    alertasGeneradas: number;
    mercantil: number;
    esal: number;
  };
  empresasPorTipo: SeriesPoint[];
  empresasPorEstado: SeriesPoint[];
  empresasPorActividad: SeriesPoint[];
  alertasPorTipo: SeriesPoint[];
  alertasEnElTiempo: SeriesPoint[];
  monitoreadasPorMunicipio: SeriesPoint[];
  opciones: { municipios: string[] };
}

export interface CompanySearchPayload {
  items: CompanyListItem[];
  total: number;
  disponibles: number;
  recientes: CompanyListItem[];
  opciones: {
    municipios: string[];
    actividades: { codigo: string; descripcion: string }[];
  };
}

export interface HomePayload {
  disponibles: number;
  monitoreadas: number;
  alertasNoLeidas: number;
  recientes: CompanyListItem[];
  alertas: AlertItem[];
  seguimiento: MonitoringItem[];
}

export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  rol: RolCodigo;
  activo: boolean;
  createdAt: string;
}

export interface AdminRole {
  codigo: RolCodigo;
  nombre: string;
  descripcion: string;
  permisos: { codigo: PermissionCode; descripcion: string; modulo: string }[];
}

export interface AppSettingItem {
  clave: string;
  valor: string;
  descripcion: string;
}
