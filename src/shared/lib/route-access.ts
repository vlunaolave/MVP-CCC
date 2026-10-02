import type { RolCodigo } from "@/shared/types/domain";

const RESTRICTED: { test: (pathname: string) => boolean; roles: RolCodigo[] }[] = [
  {
    test: (pathname) => pathname.startsWith("/administracion") || pathname.startsWith("/api/admin"),
    roles: ["ADMINISTRADOR"],
  },
  {
    test: (pathname) => pathname.startsWith("/monitoreo") || pathname.startsWith("/api/monitoreo"),
    roles: ["ADMINISTRADOR", "ANALISTA"],
  },
  {
    test: (pathname) => pathname.startsWith("/alertas") || pathname.startsWith("/api/alertas"),
    roles: ["ADMINISTRADOR", "ANALISTA"],
  },
  {
    test: (pathname) => /^\/api\/empresas\/[^/]+\/grafo$/.test(pathname),
    roles: ["ADMINISTRADOR", "ANALISTA"],
  },
];

export function rolesForPath(pathname: string): RolCodigo[] | null {
  const rule = RESTRICTED.find((item) => item.test(pathname));
  return rule ? rule.roles : null;
}

export function isRoleAllowed(pathname: string, rol: RolCodigo | undefined): boolean {
  const roles = rolesForPath(pathname);
  if (!roles) {
    return true;
  }
  if (!rol) {
    return false;
  }
  return roles.includes(rol);
}

export function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/api/auth/login";
}
