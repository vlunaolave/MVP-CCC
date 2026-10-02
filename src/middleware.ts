import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ROLE_COOKIE, SESSION_COOKIE } from "@/shared/lib/cookies";
import { isPublicPath, isRoleAllowed } from "@/shared/lib/route-access";
import type { RolCodigo } from "@/shared/types/domain";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value as RolCodigo | undefined;

  if (isPublicPath(pathname)) {
    if (sessionId && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!sessionId) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }

  if (pathname === "/acceso-denegado") {
    return NextResponse.next();
  }

  if (!isRoleAllowed(pathname, role)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/acceso-denegado", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
