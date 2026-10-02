import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { adminService } from "@/server/services/container";
import { updateUserSchema } from "@/server/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser("admin.usuarios");
    const body: unknown = await request.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisa el formulario." }, { status: 400 });
    }
    const { id } = await context.params;
    const user = await adminService.updateUser(actor, id, parsed.data);
    return NextResponse.json(user);
  } catch (error) {
    return toErrorResponse(error);
  }
}
