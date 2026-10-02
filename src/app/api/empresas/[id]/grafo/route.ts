import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { toErrorResponse } from "@/server/http";
import { companyService } from "@/server/services/container";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser("empresas.grafo");
    const { id } = await context.params;
    const graph = await companyService.graph(id);
    if (!graph) {
      throw new AppError("La empresa no existe.", 404, "NOT_FOUND");
    }
    return NextResponse.json(graph);
  } catch (error) {
    return toErrorResponse(error);
  }
}
