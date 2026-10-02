import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { alertService } from "@/server/services/container";
import { readAlertSchema } from "@/server/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser("alertas.marcar_leida");
    const body: unknown = await request.json().catch(() => null);
    const parsed = readAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Solo se puede marcar la alerta como leída." }, { status: 400 });
    }
    const { id } = await context.params;
    const alert = await alertService.markRead(user, id);
    return NextResponse.json(alert);
  } catch (error) {
    return toErrorResponse(error);
  }
}
