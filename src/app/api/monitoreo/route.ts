import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { monitoringService } from "@/server/services/container";
import { monitorBodySchema, monitoringQuerySchema, readQuery } from "@/server/validation";

export async function GET(request: Request) {
  try {
    const user = await requireUser("monitoreo.ver");
    const filters = monitoringQuerySchema.parse(readQuery(request));
    const items = await monitoringService.list(user, filters);
    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser("empresas.monitorear");
    const body: unknown = await request.json().catch(() => null);
    const parsed = monitorBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Selecciona una empresa." }, { status: 400 });
    }
    const result = await monitoringService.add(user, parsed.data.companyId);
    return NextResponse.json({ ok: true, estado: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
