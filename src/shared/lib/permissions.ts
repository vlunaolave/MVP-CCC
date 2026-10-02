import type { PermissionCode, RolCodigo } from "@/shared/types/domain";

export const ROLE_PERMISSIONS: Record<RolCodigo, PermissionCode[]> = {
  ADMINISTRADOR: [
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
  ],
  ANALISTA: [
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
    "sectores.ver",
    "listas.ver",
    "listas.gestionar",
    "busquedas.guardar",
  ],
  CONSULTOR: [
    "inicio.ver",
    "empresas.consultar",
    "empresas.perfil",
    "dashboard.ver",
    "sectores.ver",
    "busquedas.guardar",
  ],
};

export function permissionsForRole(rol: RolCodigo): PermissionCode[] {
  return ROLE_PERMISSIONS[rol];
}

export function hasPermission(rol: RolCodigo, permission: PermissionCode): boolean {
  return ROLE_PERMISSIONS[rol].includes(permission);
}
