import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { listService } from "@/server/services/container";

export async function GET() {
  try {
    const user = await requireUser("listas.ver");
    const items = await listService.list(user);
    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}
