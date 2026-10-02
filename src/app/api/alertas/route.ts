import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";
import { alertService } from "@/server/services/container";
import { alertQuerySchema, readQuery } from "@/server/validation";

export async function GET(request: Request) {
  try {
    await requireUser("alertas.ver");
    const parsed = alertQuerySchema.parse(readQuery(request));
    const result = await alertService.search({
      ...parsed,
      leida: parsed.leida === undefined ? undefined : parsed.leida === "true",
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
