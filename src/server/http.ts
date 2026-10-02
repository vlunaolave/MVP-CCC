import { NextResponse } from "next/server";

import { AppError } from "@/server/errors";

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "No se pudo completar la operación." }, { status: 500 });
}
