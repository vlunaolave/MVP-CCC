-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "modulo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Company" (
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
    "fechaUltimaActualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "numeroDocumento" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    CONSTRAINT "Establishment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyRelation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "personId" TEXT,
    "relatedCompanyId" TEXT,
    "establishmentId" TEXT,
    "descripcion" TEXT NOT NULL,
    "porcentajeParticipacion" DECIMAL,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME,
    "vigente" BOOLEAN NOT NULL,
    CONSTRAINT "CompanyRelation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompanyRelation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CompanyRelation_relatedCompanyId_fkey" FOREIGN KEY ("relatedCompanyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CompanyRelation_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "metadata" JSONB,
    CONSTRAINT "TimelineEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipoEvento" TEXT NOT NULL,
    "campoObservado" TEXT NOT NULL,
    "condicion" TEXT NOT NULL,
    "valorReferencia" TEXT,
    "severidad" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL,
    "esDemostrativa" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    CONSTRAINT "Alert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alert_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonitoredCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fechaInicio" DATETIME NOT NULL,
    CONSTRAINT "MonitoredCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonitoredCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "fecha" DATETIME NOT NULL,
    "metadata" JSONB,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_proveedor_subject_key" ON "AuthIdentity"("proveedor", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "Role_codigo_key" ON "Role"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_codigo_key" ON "Permission"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Company_nit_key" ON "Company"("nit");

-- CreateIndex
CREATE INDEX "Company_razonSocial_idx" ON "Company"("razonSocial");

-- CreateIndex
CREATE INDEX "Company_nombreComercial_idx" ON "Company"("nombreComercial");

-- CreateIndex
CREATE INDEX "Company_tipoRegistro_idx" ON "Company"("tipoRegistro");

-- CreateIndex
CREATE INDEX "Company_estadoMatricula_idx" ON "Company"("estadoMatricula");

-- CreateIndex
CREATE INDEX "Company_municipio_idx" ON "Company"("municipio");

-- CreateIndex
CREATE INDEX "Company_actividadEconomicaCodigo_idx" ON "Company"("actividadEconomicaCodigo");

-- CreateIndex
CREATE INDEX "Company_tamanoEmpresa_idx" ON "Company"("tamanoEmpresa");

-- CreateIndex
CREATE INDEX "TimelineEvent_companyId_fecha_idx" ON "TimelineEvent"("companyId", "fecha");

-- CreateIndex
CREATE INDEX "Alert_leida_fecha_idx" ON "Alert"("leida", "fecha");

-- CreateIndex
CREATE INDEX "Alert_companyId_fecha_idx" ON "Alert"("companyId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredCompany_userId_companyId_key" ON "MonitoredCompany"("userId", "companyId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_accion_fecha_idx" ON "AuditLog"("userId", "accion", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_clave_key" ON "AppSetting"("clave");
