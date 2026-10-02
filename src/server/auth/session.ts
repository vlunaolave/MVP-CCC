import { cookies } from "next/headers";

import { ROLE_COOKIE, SESSION_COOKIE, SESSION_TTL_MS, sessionCookieOptions } from "@/shared/lib/cookies";
import { hasPermission, permissionsForRole } from "@/shared/lib/permissions";
import { prisma } from "@/shared/lib/prisma";
import type { PermissionCode, SessionUser } from "@/shared/types/domain";
import { AppError } from "@/server/errors";

export { ROLE_COOKIE, SESSION_COOKIE };

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const session = await prisma.session.create({
    data: { userId, proveedor: "LOCAL", expiresAt },
  });
  const jar = await cookies();
  const options = sessionCookieOptions(expiresAt);
  jar.set(SESSION_COOKIE, session.id, options);
  jar.set(ROLE_COOKIE, user.rol, options);
  return session;
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(ROLE_COOKIE);
}

async function loadSettings() {
  const rows = await prisma.appSetting.findMany();
  const map = new Map(rows.map((row) => [row.clave, row.valor]));
  return {
    aviso:
      map.get("demo.aviso") ??
      "Los datos de esta plataforma son simulados y no identifican personas ni empresas reales.",
    plataformaNombre: map.get("plataforma.nombre") ?? "Plataforma Integral de Inteligencia Empresarial",
  };
}

export async function getCurrentSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return null;
  }
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() < Date.now() || !session.user.activo) {
    return null;
  }
  const settings = await loadSettings();
  return {
    id: session.user.id,
    email: session.user.email,
    nombre: session.user.nombre,
    rol: session.user.rol,
    permisos: permissionsForRole(session.user.rol),
    aviso: settings.aviso,
    plataformaNombre: settings.plataformaNombre,
  };
}

export async function requireUser(permission?: PermissionCode): Promise<SessionUser> {
  const user = await getCurrentSession();
  if (!user) {
    throw new AppError("No autenticado.", 401, "UNAUTHENTICATED");
  }
  if (permission && !hasPermission(user.rol, permission)) {
    throw new AppError("No autorizado.", 403, "FORBIDDEN");
  }
  return user;
}
