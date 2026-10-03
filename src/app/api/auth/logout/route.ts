import { NextResponse } from "next/server";

import { clearSessionCookie, requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { auditService } from "@/server/services/container";
import { prisma } from "@/shared/lib/prisma";

export async function POST() {
  try {
    const user = await requireUser();
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await auditService.write({ userId: user.id, accion: "LOGOUT", entidad: "Session", entidadId: user.id });
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
