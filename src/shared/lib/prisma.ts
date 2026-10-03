import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const BUNDLED_DB = path.join(process.cwd(), "prisma", "demo.db");
const RUNTIME_DB = "/tmp/ccc-demo.db";

function ensureDatabaseUrl() {
  const onVercel = process.env.VERCEL === "1" && process.env.CCC_PREPARE_DEMO_DB !== "1";
  if (!onVercel) {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = "file:./dev.db";
    }
    return;
  }
  if (!existsSync(RUNTIME_DB)) {
    if (!existsSync(BUNDLED_DB)) {
      throw new Error("Falta prisma/demo.db en el despliegue. El build debe ejecutar scripts/prepare-demo-db.mjs.");
    }
    copyFileSync(BUNDLED_DB, RUNTIME_DB);
  }
  process.env.DATABASE_URL = "file:/tmp/ccc-demo.db";
}

ensureDatabaseUrl();

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
