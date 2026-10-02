import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { adminService } from "@/server/services/container";
import { createUserSchema } from "@/server/validation";

export async function GET() {
  try {
    await requireUser("admin.usuarios");
    const items = await adminService.users();
    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireUser("admin.usuarios");
    const body: unknown = await request.json().catch(() => null);
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisa el formulario." }, { status: 400 });
    }
    const user = await adminService.createUser(actor, parsed.data);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
