import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { savedSearchService } from "@/server/services/container";
import { savedSearchSchema } from "@/server/validation";

export async function GET() {
  try {
    const user = await requireUser("empresas.consultar");
    const items = await savedSearchService.list(user);
    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser("busquedas.guardar");
    const body = savedSearchSchema.parse(await request.json());
    const created = await savedSearchService.create(user, body.nombre, body.filtros);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
