import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { adminService } from "@/server/services/container";
import { settingSchema } from "@/server/validation";

export async function GET() {
  try {
    await requireUser("admin.configuracion");
    const items = await adminService.settings();
    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireUser("admin.configuracion");
    const body: unknown = await request.json().catch(() => null);
    const parsed = settingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisa el formulario." }, { status: 400 });
    }
    const item = await adminService.updateSetting(actor, parsed.data.clave, parsed.data.valor);
    return NextResponse.json(item);
  } catch (error) {
    return toErrorResponse(error);
  }
}
