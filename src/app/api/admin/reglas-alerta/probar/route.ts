import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { alertRuleService } from "@/server/services/container";
import { alertRulePreviewSchema } from "@/server/validation";

export async function POST(request: Request) {
  try {
    await requireUser("admin.configuracion");
    const body: unknown = await request.json().catch(() => null);
    const parsed = alertRulePreviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisa la prueba." }, { status: 400 });
    }
    const { companyId, ...rule } = parsed.data;
    const result = await alertRuleService.preview(rule, companyId);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
