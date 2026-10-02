import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { toErrorResponse } from "@/server/http";
import { companyService } from "@/server/services/container";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser("empresas.perfil");
    const { id } = await context.params;
    const profile = await companyService.profile(user, id);
    if (!profile) {
      throw new AppError("La empresa no existe.", 404, "NOT_FOUND");
    }
    return NextResponse.json(profile);
  } catch (error) {
    return toErrorResponse(error);
  }
}
