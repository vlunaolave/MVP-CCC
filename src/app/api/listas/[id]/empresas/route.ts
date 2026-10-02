import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { listService } from "@/server/services/container";
import { watchlistCompanySchema } from "@/server/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser("listas.gestionar");
    const { id } = await context.params;
    const body = watchlistCompanySchema.parse(await request.json());
    const result = await listService.add(user, id, body.companyId);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
