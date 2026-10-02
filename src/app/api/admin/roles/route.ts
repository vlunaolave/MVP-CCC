import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { adminService } from "@/server/services/container";

export async function GET() {
  try {
    await requireUser("admin.roles");
    const items = await adminService.roles();
    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}
