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
  "sectores.ver",
  "listas.ver",
  "listas.gestionar",
  "busquedas.guardar",
] as const;
export type PermissionCode = (typeof PERMISSION_CODES)[number];

export type TipoRegistro = "MERCANTIL" | "ESAL";
export type EstadoMatricula = "ACTIVA" | "SUSPENDIDA" | "CANCELADA" | "INACTIVA";
export type EstadoJuridico = "VIGENTE" | "EN_LIQUIDACION" | "DISUELTA" | "INACTIVA";
export type TamanoEmpresa = "MICRO" | "PEQUENA" | "MEDIANA" | "GRANDE";
export type Severidad = "INFORMATIVA" | "ATENCION" | "IMPORTANTE";
export const SECTOR_CODIGOS = [
  "TECNOLOGIA",
  "COMERCIO",
  "CONSTRUCCION",
  "SERVICIOS",
  "INDUSTRIA",
  "TRANSPORTE",
  "SALUD",
] as const;
export type SectorCodigo = (typeof SECTOR_CODIGOS)[number];
export type CategoriaEvento = "REGISTRAL" | "CORPORATIVO" | "FINANCIERO" | "NOTICIA";
export type CategoriaTimeline = CategoriaEvento | "ALERTA";
export const TIPO_LISTA = [
  "CLIENTES_ESTRATEGICOS",
  "PROSPECTOS",
  "PROVEEDORES",
  "TECNOLOGIA",
  "PERSONAL",
] as const;
export type TipoLista = (typeof TIPO_LISTA)[number];
export type TipoRelacion =
  | "REPRESENTANTE_LEGAL"
  | "SOCIO"
  | "ESTABLECIMIENTO"
  | "PERSONA_OTRA_EMPRESA"
  | "EMPRESA_RELACIONADA"
  | "SUPLENTE"
  | "MIEMBRO_JUNTA"
  | "REVISOR_FISCAL"
  | "OTRO_CARGO"
  | "MATRIZ"
  | "SUBSIDIARIA";
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
  | "OTRO_REGISTRAL"
  | "NOTICIA"
  | "NOMBRAMIENTO"
  | "CAMBIO_PARTICIPACION";
export type GraphNodeType =
  | "empresa"
  | "representante"
  | "socio"
  | "persona"
  | "establecimiento"
  | "relacionada"
  | "suplente"
  | "junta"
  | "revisor"
  | "accionista"
  | "matriz"
  | "subsidiaria";
export type SortKey =
  | "razonSocial"
  | "nit"
  | "sector"
  | "municipio"
  | "revenue"
  | "totalAssets"
  | "employees"
  | "estadoMatricula";
export type SortDir = "asc" | "desc";

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
  sector: SectorCodigo;
  numeroEmpleados: number | null;
  ingresos: number | null;
  activosEstados: number | null;
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
  fuenteDatos: string;
  cobertura: Cobertura;
  ultimoPeriodo: UltimoPeriodo | null;
  relaciones: RelationItem[] | null;
  timeline: TimelineItem[] | null;
  alertas: AlertItem[] | null;
}

export interface Cobertura {
  registral: "Completa" | "Incompleta";
  financiera: string;
  directivos: string;
  propiedad: string;
  relaciones: string;
  ultimaActualizacion: string;
}

export interface UltimoPeriodo {
  year: number;
  ingresos: number;
  activos: number;
  patrimonio: number;
  utilidad: number;
  empleados: number;
  variacionIngresos: number | null;
  variacionActivos: number | null;
  variacionPatrimonio: number | null;
  variacionUtilidad: number | null;
  variacionEmpleados: number | null;
  anioAnterior: number | null;
}

export interface IndicatorSet {
  margenNeto: number | null;
  margenOperativo: number | null;
  roa: number | null;
  roe: number | null;
  razonCorriente: number | null;
  deudaPatrimonio: number | null;
  crecimientoIngresos: number | null;
  crecimientoActivos: number | null;
}

export interface FinancialPeriod {
  year: number;
  revenue: number;
  ebitda: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  employees: number;
  currentAssets: number | null;
  currentLiabilities: number | null;
  indicadores: IndicatorSet;
}

export interface FinancePayload {
  periodos: FinancialPeriod[];
  indicadores: IndicatorSet;
  fuente: "DEMO";
}

export interface SimilarItem {
  id: string;
  razonSocial: string;
  nit: string;
  sector: SectorCodigo;
  ciudad: string;
  tamanoEmpresa: TamanoEmpresa;
  ingresos: number | null;
  puntaje: number;
}

export interface SectorComparisonRow {
  clave: string;
  etiqueta: string;
  formato: "money" | "percent" | "times" | "number";
  empresa: number | null;
  promedio: number | null;
  absoluta: number | null;
  porcentual: number | null;
}

export interface SectorComparisonPayload {
  vacio?: boolean;
  anio?: number;
  filas?: SectorComparisonRow[];
}

export interface ComparadorColumna {
  id: string;
  razonSocial: string;
  nit: string;
  sector: SectorCodigo;
  ciudad: string;
  antiguedad: string | null;
  empleados: number | null;
  ingresos: number | null;
  ebitda: number | null;
  utilidad: number | null;
  activos: number | null;
  patrimonio: number | null;
  margenNeto: number | null;
  roe: number | null;
  crecimientoIngresos: number | null;
  anio: number | null;
}

export interface ComparadorPayload {
  columnas: ComparadorColumna[];
  ausentes: string[];
}

export interface SectorResumen {
  codigo: SectorCodigo;
  slug: string;
  nombre: string;
  empresas: number;
  ingresosAgregados: number;
  empleados: number;
  crecimientoPromedio: number | null;
}

export interface SectorDetalle extends SectorResumen {
  resumen: string;
  principales: {
    id: string;
    razonSocial: string;
    nit: string;
    municipio: string;
    ingresos: number | null;
  }[];
  porTamano: SeriesPoint[];
  porMunicipio: SeriesPoint[];
  evolucionIngresos: { year: number; ingresos: number }[];
  indicadores: IndicatorSet;
  anioBenchmark: number | null;
}

export interface WatchlistCompany {
  id: string;
  razonSocial: string;
  nit: string;
  sector: SectorCodigo;
}

export interface WatchlistItem {
  id: string;
  nombre: string;
  tipo: TipoLista;
  empresas: WatchlistCompany[];
}

export interface SavedSearchItem {
  id: string;
  nombre: string;
  filtros: import("@/shared/types/filters").CompanyFilters;
  createdAt: string;
}

export interface RelationItem {
  id: string;
  tipo: TipoRelacion;
  descripcion: string;
  cargo: string | null;
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
  tipo: TipoEvento | null;
  categoria: CategoriaTimeline;
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
  type: GraphNodeType;
  data: {
    titulo: string;
    subtitulo: string;
    empresaId: string | null;
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
    disponibles: number;
    consultadas: number;
    monitoreadas: number;
    alertasGeneradas: number;
    mercantil: number;
    esal: number;
    ingresosAgregados: number;
    crecimientoPromedio: number | null;
  };
  empresasPorTipo: SeriesPoint[];
  empresasPorEstado: SeriesPoint[];
  empresasPorActividad: SeriesPoint[];
  empresasPorSector: SeriesPoint[];
  empresasPorDepartamento: SeriesPoint[];
  empresasPorTamano: SeriesPoint[];
  alertasPorTipo: SeriesPoint[];
  alertasPorCategoria: SeriesPoint[];
  alertasEnElTiempo: SeriesPoint[];
  monitoreadasPorMunicipio: SeriesPoint[];
  opciones: { municipios: string[]; departamentos: string[]; sectores: SectorCodigo[]; tamanos: TamanoEmpresa[] };
}

export interface CompanySearchPayload {
  items: CompanyListItem[];
  total: number;
  disponibles: number;
  recientes: CompanyListItem[];
  opciones: {
    municipios: string[];
    departamentos: string[];
    sectores: SectorCodigo[];
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
