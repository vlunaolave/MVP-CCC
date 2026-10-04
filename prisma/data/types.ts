export interface CompanySeed {
  id: string;
  nit: string;
  razonSocial: string;
  nombreComercial: string | null;
  tipoOrganizacion: string;
  tipoRegistro: "MERCANTIL" | "ESAL";
  estadoMatricula: "ACTIVA" | "SUSPENDIDA" | "CANCELADA" | "INACTIVA";
  numeroMatricula: string;
  fechaMatricula: string;
  fechaRenovacion: string | null;
  camaraComercio: string;
  municipio: string;
  departamento: string;
  direccion: string;
  telefono: string | null;
  email: string | null;
  sitioWeb: string | null;
  actividadEconomicaCodigo: string;
  actividadEconomicaDescripcion: string;
  tamanoEmpresa: "MICRO" | "PEQUENA" | "MEDIANA" | "GRANDE";
  numeroEmpleados: number | null;
  capital: number | null;
  activos: number | null;
  fechaConstitucion: string | null;
  estado: "VIGENTE" | "EN_LIQUIDACION" | "DISUELTA" | "INACTIVA";
  representanteLegal: string | null;
  sector: "TECNOLOGIA" | "COMERCIO" | "CONSTRUCCION" | "SERVICIOS" | "INDUSTRIA" | "TRANSPORTE" | "SALUD";
  fuenteDatos: "DEMO";
}

export interface PersonSeed {
  id: string;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
}

export interface EstablishmentSeed {
  id: string;
  companyId: string;
  nombre: string;
  direccion: string;
  municipio: string;
  departamento: string;
  estado: "ABIERTO" | "CERRADO";
}

export interface RelationSeed {
  id: string;
  companyId: string;
  tipo:
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
  personId?: string;
  relatedCompanyId?: string;
  establishmentId?: string;
  descripcion: string;
  cargo?: string;
  porcentajeParticipacion?: number;
  fechaInicio: string;
  fechaFin?: string;
  vigente: boolean;
}

export interface ChangeMetadata {
  valorAnterior: string;
  valorNuevo: string;
}

export interface EventSeed {
  id: string;
  companyId: string;
  tipo:
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
  categoria: "REGISTRAL" | "CORPORATIVO" | "FINANCIERO" | "NOTICIA";
  fecha: string;
  titulo: string;
  descripcion: string;
  fuente: "REGISTRO_MERCANTIL" | "ESAL" | "DEMO";
  metadata?: ChangeMetadata;
}

export interface AlertRuleSeed {
  id: string;
  nombre: string;
  descripcion: string;
  tipoEvento: EventSeed["tipo"];
  campoObservado: string;
  condicion: "CAMBIO" | "IGUAL_A" | "DISTINTO_DE";
  valorReferencia: string | null;
  severidad: "INFORMATIVA" | "ATENCION" | "IMPORTANTE";
  activa: boolean;
  esDemostrativa: boolean;
}

export interface UserSeed {
  email: string;
  nombre: string;
  rol: "ADMINISTRADOR" | "ANALISTA" | "CONSULTOR";
  password: string;
  activo: boolean;
}

export interface MonitoringSeed {
  userEmail: string;
  companyId: string;
  fechaInicio: string;
}

export interface AuditSeed {
  userEmail: string;
  companyId: string;
  fecha: string;
}

export interface SettingSeed {
  clave: string;
  valor: string;
  descripcion: string;
}

export interface FinancialSeed {
  id: string;
  companyId: string;
  year: number;
  cutoffDate: string;
  revenue: number;
  ebitda: number;
  operatingProfit: number;
  interestExpense: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  employees: number;
  currentAssets?: number;
  currentLiabilities?: number;
}

export interface UnspscSeed {
  id: string;
  companyId: string;
  code: string;
  segment: string;
  family: string;
  clase: string;
  commodity: string;
  description: string;
  isPrimary: boolean;
}

export interface BenchmarkSeed {
  sector: CompanySeed["sector"];
  year: number;
  avgRevenue: number;
  avgEbitda: number;
  avgNetProfit: number;
  avgAssets: number;
  avgLiabilities: number;
  avgEquity: number;
  avgEmployees: number;
  avgRevenueGrowth: number;
  avgAssetGrowth: number;
}

export interface WatchlistSeed {
  id: string;
  userEmail: string;
  nombre: string;
  tipo: "CLIENTES_ESTRATEGICOS" | "PROSPECTOS" | "PROVEEDORES" | "TECNOLOGIA" | "PERSONAL";
  companyIds: string[];
}

export interface ReferenceDataset {
  companies: CompanySeed[];
  people: PersonSeed[];
  establishments: EstablishmentSeed[];
  relations: RelationSeed[];
  events: EventSeed[];
  alertRules: AlertRuleSeed[];
  users: UserSeed[];
  monitoring: MonitoringSeed[];
  initialAudit: AuditSeed[];
  settings: SettingSeed[];
  financials: FinancialSeed[];
  unspsc: UnspscSeed[];
  benchmarks: BenchmarkSeed[];
  watchlists: WatchlistSeed[];
}
