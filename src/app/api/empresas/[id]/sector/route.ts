import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { companyService } from "@/server/services/container";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser("empresas.perfil");
    const { id } = await context.params;
    const payload = await companyService.versusSector(id);
    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}
