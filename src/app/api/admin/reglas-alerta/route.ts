import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { alertRuleService } from "@/server/services/container";
import { alertRuleBodySchema } from "@/server/validation";

export async function GET() {
  try {
    await requireUser("admin.configuracion");
    const items = await alertRuleService.list();
    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireUser("admin.configuracion");
    const body: unknown = await request.json().catch(() => null);
    const parsed = alertRuleBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisa el formulario." }, { status: 400 });
    }
    const item = await alertRuleService.create(actor, parsed.data);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
