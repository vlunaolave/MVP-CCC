import { NextResponse } from "next/server";

import { SLUG_SECTOR } from "@/shared/utils/labels";
import { requireUser } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { toErrorResponse } from "@/server/http";
import { sectorService } from "@/server/services/container";

export async function GET(_request: Request, context: { params: Promise<{ codigo: string }> }) {
  try {
    await requireUser("sectores.ver");
    const { codigo } = await context.params;
    const sector = SLUG_SECTOR[codigo.toLowerCase()];
    if (!sector) {
      throw new AppError("El sector no existe.", 404, "NOT_FOUND");
    }
    const detail = await sectorService.detail(sector);
    return NextResponse.json(detail);
  } catch (error) {
    return toErrorResponse(error);
  }
}
