import { NextResponse } from "next/server";

import { getAuthProvider } from "@/server/auth/local-provider";
import { createSession } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { auditService } from "@/server/services/container";
import { prisma } from "@/shared/lib/prisma";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const { userId } = await getAuthProvider().authenticate(body);
    await createSession(userId);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await auditService.write({
      userId,
      accion: "LOGIN",
      entidad: "User",
      entidadId: userId,
      metadata: { rol: user.rol },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
