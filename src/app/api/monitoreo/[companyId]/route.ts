import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { monitoringService } from "@/server/services/container";

export async function DELETE(_request: Request, context: { params: Promise<{ companyId: string }> }) {
  try {
    const user = await requireUser("empresas.monitorear");
    const { companyId } = await context.params;
    await monitoringService.remove(user, companyId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
