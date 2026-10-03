import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

rmSync("prisma/demo.db", { force: true });
rmSync("prisma/demo.db-journal", { force: true });

const env = {
  ...process.env,
  DATABASE_URL: "file:./demo.db",
  CCC_PREPARE_DEMO_DB: "1",
};

execSync("npx prisma generate", { stdio: "inherit", env });
execSync("npx prisma migrate deploy", { stdio: "inherit", env });
execSync("npx prisma db seed", { stdio: "inherit", env });
