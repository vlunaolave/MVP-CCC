import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { alertRuleService } from "@/server/services/container";
import { alertRuleBodySchema } from "@/server/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser("admin.configuracion");
    const { id } = await context.params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = alertRuleBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisa el formulario." }, { status: 400 });
    }
    const item = await alertRuleService.update(actor, id, parsed.data);
    return NextResponse.json(item);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser("admin.configuracion");
    const { id } = await context.params;
    await alertRuleService.remove(actor, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
