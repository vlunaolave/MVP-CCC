import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { dashboardService } from "@/server/services/container";
import { dashboardQuerySchema, readQuery } from "@/server/validation";

export async function GET(request: Request) {
  try {
    await requireUser("dashboard.ver");
    const filters = dashboardQuerySchema.parse(readQuery(request));
    const payload = await dashboardService.aggregates(filters);
    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}
