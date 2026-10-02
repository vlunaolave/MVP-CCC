import type { AuditSeed, MonitoringSeed, SettingSeed, UserSeed } from "./types";

export const DEMO_PASSWORD = "CccDemo.2026";

export const users: UserSeed[] = [
  {
    email: "admin@demo.ccc",
    nombre: "Ana López",
    rol: "ADMINISTRADOR",
    password: DEMO_PASSWORD,
    activo: true,
  },
  {
    email: "analista@demo.ccc",
    nombre: "Julián Herrera Mejía",
    rol: "ANALISTA",
    password: DEMO_PASSWORD,
    activo: true,
  },
  {
    email: "consultor@demo.ccc",
    nombre: "Sofía Delgado Ríos",
    rol: "CONSULTOR",
    password: DEMO_PASSWORD,
    activo: true,
  },
];

export const monitoringSeed: MonitoringSeed[] = [
  { userEmail: "analista@demo.ccc", companyId: "co-innova", fechaInicio: "2026-01-15" },
  { userEmail: "analista@demo.ccc", companyId: "co-horizonte", fechaInicio: "2026-02-01" },
  { userEmail: "analista@demo.ccc", companyId: "co-nube", fechaInicio: "2026-02-20" },
  { userEmail: "analista@demo.ccc", companyId: "co-metal", fechaInicio: "2026-03-01" },
  { userEmail: "analista@demo.ccc", companyId: "co-rutas", fechaInicio: "2026-03-10" },
  { userEmail: "admin@demo.ccc", companyId: "co-innova", fechaInicio: "2026-02-12" },
  { userEmail: "admin@demo.ccc", companyId: "co-horizonte", fechaInicio: "2026-03-01" },
];

export const initialAudit: AuditSeed[] = [
  { userEmail: "analista@demo.ccc", companyId: "co-innova", fecha: "2026-03-18" },
  { userEmail: "analista@demo.ccc", companyId: "co-horizonte", fecha: "2026-03-20" },
];

export const settings: SettingSeed[] = [
  {
    clave: "plataforma.nombre",
    valor: "Plataforma Integral de Inteligencia Empresarial",
    descripcion: "Nombre visible de la plataforma.",
  },
  {
    clave: "camara.nombre",
    valor: "Cámara de Comercio de Cali",
    descripcion: "Cámara de comercio de referencia del MVP.",
  },
  {
    clave: "demo.aviso",
    valor: "Los datos de esta plataforma son simulados y no identifican personas ni empresas reales.",
    descripcion: "Aviso permanente de que la información es ficticia.",
  },
];

export const roleCatalog = [
  {
    codigo: "ADMINISTRADOR" as const,
    nombre: "Administrador",
    descripcion: "Gestiona usuarios, roles y la configuración de la plataforma, y consulta todo el padrón.",
  },
  {
    codigo: "ANALISTA" as const,
    nombre: "Analista",
    descripcion: "Consulta empresas, monitoreo, alertas, tablero, relaciones y línea de tiempo.",
  },
  {
    codigo: "CONSULTOR" as const,
    nombre: "Consultor",
    descripcion: "Consulta empresas, el resumen registral y el tablero, en modo lectura.",
  },
];

export const permissionCatalog = [
  { codigo: "inicio.ver", descripcion: "Ver el inicio", modulo: "inicio" },
  { codigo: "empresas.consultar", descripcion: "Buscar empresas", modulo: "empresas" },
  { codigo: "empresas.perfil", descripcion: "Ver el perfil empresarial", modulo: "empresas" },
  { codigo: "empresas.relaciones", descripcion: "Ver relaciones", modulo: "empresas" },
  { codigo: "empresas.timeline", descripcion: "Ver la línea de tiempo", modulo: "empresas" },
  { codigo: "empresas.grafo", descripcion: "Ver el grafo", modulo: "empresas" },
  { codigo: "empresas.monitorear", descripcion: "Agregar o quitar empresas del monitoreo", modulo: "empresas" },
  { codigo: "monitoreo.ver", descripcion: "Ver el listado de monitoreo", modulo: "monitoreo" },
  { codigo: "alertas.ver", descripcion: "Ver el centro de alertas", modulo: "alertas" },
  { codigo: "alertas.marcar_leida", descripcion: "Marcar una alerta como leída", modulo: "alertas" },
  { codigo: "dashboard.ver", descripcion: "Ver el tablero", modulo: "dashboard" },
  { codigo: "admin.usuarios", descripcion: "Administrar usuarios", modulo: "administracion" },
  { codigo: "admin.roles", descripcion: "Consultar roles y permisos", modulo: "administracion" },
  { codigo: "admin.configuracion", descripcion: "Editar la configuración", modulo: "administracion" },
];
