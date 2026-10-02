import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { sectorService } from "@/server/services/container";

export async function GET() {
  try {
    await requireUser("sectores.ver");
    const items = await sectorService.list();
    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}
