import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { companyService } from "@/server/services/container";
import { companyQuerySchema, readQuery } from "@/server/validation";

export async function GET(request: Request) {
  try {
    const user = await requireUser("empresas.consultar");
    const filters = companyQuerySchema.parse(readQuery(request));
    const result = await companyService.search(user, filters);
    return NextResponse.json({
      items: result.items,
      total: result.items.length,
      disponibles: result.totalDisponibles,
      recientes: result.recientes,
      opciones: result.opciones,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
