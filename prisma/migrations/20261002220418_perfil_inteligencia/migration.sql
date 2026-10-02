/*
  Warnings:

  - Added the required column `sector` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoria` to the `TimelineEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CompanyRelation" ADD COLUMN "cargo" TEXT;

-- CreateTable
CREATE TABLE "CompanyFinancialPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "revenue" DECIMAL NOT NULL,
    "ebitda" DECIMAL NOT NULL,
    "netProfit" DECIMAL NOT NULL,
    "totalAssets" DECIMAL NOT NULL,
    "totalLiabilities" DECIMAL NOT NULL,
    "equity" DECIMAL NOT NULL,
    "employees" INTEGER NOT NULL,
    "currentAssets" DECIMAL,
    "currentLiabilities" DECIMAL,
    "fuenteDatos" TEXT NOT NULL DEFAULT 'DEMO',
    CONSTRAINT "CompanyFinancialPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SectorBenchmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sector" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "avgRevenue" DECIMAL NOT NULL,
    "avgEbitda" DECIMAL NOT NULL,
    "avgNetProfit" DECIMAL NOT NULL,
    "avgAssets" DECIMAL NOT NULL,
    "avgLiabilities" DECIMAL NOT NULL,
    "avgEquity" DECIMAL NOT NULL,
    "avgEmployees" DECIMAL NOT NULL,
    "avgRevenueGrowth" DECIMAL NOT NULL,
    "avgAssetGrowth" DECIMAL NOT NULL,
    "fuenteDatos" TEXT NOT NULL DEFAULT 'DEMO'
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "watchlistId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WatchlistItem_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchlistItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "filtros" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nit" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "tipoOrganizacion" TEXT NOT NULL,
    "tipoRegistro" TEXT NOT NULL,
    "estadoMatricula" TEXT NOT NULL,
    "numeroMatricula" TEXT NOT NULL,
    "fechaMatricula" DATETIME NOT NULL,
    "fechaRenovacion" DATETIME,
    "camaraComercio" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "sitioWeb" TEXT,
    "actividadEconomicaCodigo" TEXT NOT NULL,
    "actividadEconomicaDescripcion" TEXT NOT NULL,
    "tamanoEmpresa" TEXT NOT NULL,
    "numeroEmpleados" INTEGER,
    "capital" DECIMAL,
    "activos" DECIMAL,
    "fechaConstitucion" DATETIME,
    "estado" TEXT NOT NULL,
    "representanteLegal" TEXT,
    "fechaUltimaActualizacion" DATETIME NOT NULL,
    "sector" TEXT NOT NULL,
    "fuenteDatos" TEXT NOT NULL DEFAULT 'DEMO'
);
INSERT INTO "new_Company" ("actividadEconomicaCodigo", "actividadEconomicaDescripcion", "activos", "camaraComercio", "capital", "departamento", "direccion", "email", "estado", "estadoMatricula", "fechaConstitucion", "fechaMatricula", "fechaRenovacion", "fechaUltimaActualizacion", "id", "municipio", "nit", "nombreComercial", "numeroEmpleados", "numeroMatricula", "razonSocial", "representanteLegal", "sitioWeb", "tamanoEmpresa", "telefono", "tipoOrganizacion", "tipoRegistro") SELECT "actividadEconomicaCodigo", "actividadEconomicaDescripcion", "activos", "camaraComercio", "capital", "departamento", "direccion", "email", "estado", "estadoMatricula", "fechaConstitucion", "fechaMatricula", "fechaRenovacion", "fechaUltimaActualizacion", "id", "municipio", "nit", "nombreComercial", "numeroEmpleados", "numeroMatricula", "razonSocial", "representanteLegal", "sitioWeb", "tamanoEmpresa", "telefono", "tipoOrganizacion", "tipoRegistro" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_nit_key" ON "Company"("nit");
CREATE INDEX "Company_razonSocial_idx" ON "Company"("razonSocial");
CREATE INDEX "Company_nombreComercial_idx" ON "Company"("nombreComercial");
CREATE INDEX "Company_tipoRegistro_idx" ON "Company"("tipoRegistro");
CREATE INDEX "Company_estadoMatricula_idx" ON "Company"("estadoMatricula");
CREATE INDEX "Company_municipio_idx" ON "Company"("municipio");
CREATE INDEX "Company_actividadEconomicaCodigo_idx" ON "Company"("actividadEconomicaCodigo");
CREATE INDEX "Company_tamanoEmpresa_idx" ON "Company"("tamanoEmpresa");
CREATE INDEX "Company_sector_idx" ON "Company"("sector");
CREATE INDEX "Company_departamento_idx" ON "Company"("departamento");
CREATE TABLE "new_TimelineEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "metadata" JSONB,
    CONSTRAINT "TimelineEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TimelineEvent" ("companyId", "descripcion", "fecha", "fuente", "id", "metadata", "tipo", "titulo") SELECT "companyId", "descripcion", "fecha", "fuente", "id", "metadata", "tipo", "titulo" FROM "TimelineEvent";
DROP TABLE "TimelineEvent";
ALTER TABLE "new_TimelineEvent" RENAME TO "TimelineEvent";
CREATE INDEX "TimelineEvent_companyId_fecha_idx" ON "TimelineEvent"("companyId", "fecha");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CompanyFinancialPeriod_companyId_year_key" ON "CompanyFinancialPeriod"("companyId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "SectorBenchmark_sector_year_key" ON "SectorBenchmark"("sector", "year");

-- CreateIndex
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_watchlistId_companyId_key" ON "WatchlistItem"("watchlistId", "companyId");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");
