-- AlterTable
ALTER TABLE "CompanyFinancialPeriod" ADD COLUMN "cutoffDate" DATETIME NOT NULL DEFAULT '2025-12-31 00:00:00';
ALTER TABLE "CompanyFinancialPeriod" ADD COLUMN "operatingProfit" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "CompanyFinancialPeriod" ADD COLUMN "interestExpense" DECIMAL NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CompanyUnspscClassification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "clase" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CompanyUnspscClassification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyUnspscClassification_companyId_code_key" ON "CompanyUnspscClassification"("companyId", "code");
CREATE INDEX "CompanyUnspscClassification_code_idx" ON "CompanyUnspscClassification"("code");
