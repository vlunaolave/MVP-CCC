import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/session";
import { toErrorResponse } from "@/server/http";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(user);
  } catch (error) {
    return toErrorResponse(error);
  }
}
