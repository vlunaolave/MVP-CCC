import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { listService } from "@/server/services/container";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; companyId: string }> }) {
  try {
    const user = await requireUser("listas.gestionar");
    const { id, companyId } = await context.params;
    await listService.remove(user, id, companyId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
