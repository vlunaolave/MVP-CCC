import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearSessionCookie, requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { auditService } from "@/server/services/container";
import { SESSION_COOKIE } from "@/shared/lib/cookies";
import { prisma } from "@/shared/lib/prisma";

export async function POST() {
  try {
    const user = await requireUser();
    const jar = await cookies();
    const sessionId = jar.get(SESSION_COOKIE)?.value;
    if (sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }
    await auditService.write({ userId: user.id, accion: "LOGOUT", entidad: "Session", entidadId: sessionId });
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
