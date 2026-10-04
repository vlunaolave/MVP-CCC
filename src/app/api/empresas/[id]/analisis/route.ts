import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { companyService } from "@/server/services/container";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser("empresas.perfil");
    const { id } = await context.params;
    const analysis = await companyService.analysis(user, id);
    return NextResponse.json(analysis);
  } catch (error) {
    return toErrorResponse(error);
  }
}
