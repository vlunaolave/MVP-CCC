import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { toErrorResponse } from "@/server/http";
import { companyService } from "@/server/services/container";
import { comparadorQuerySchema, readQuery } from "@/server/validation";

export async function GET(request: Request) {
  try {
    await requireUser("empresas.consultar");
    const query = comparadorQuerySchema.parse(readQuery(request));
    const ids = [...new Set((query.ids ?? "").split(",").map((id) => id.trim()).filter(Boolean))];
    if (ids.length > 4) {
      throw new AppError("El comparador admite máximo 4 empresas", 400, "LIMIT");
    }
    const payload = await companyService.compare(ids);
    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}
