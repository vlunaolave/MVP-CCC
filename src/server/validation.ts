import { z } from "zod";

import { ROL_CODIGOS, SECTOR_CODIGOS } from "@/shared/types/domain";

const tipoEventoSchema = z.enum([
  "CONSTITUCION",
  "MATRICULA",
  "RENOVACION",
  "CAMBIO_REPRESENTANTE",
  "CAMBIO_DOMICILIO",
  "MODIFICACION_ACTIVIDAD",
  "CAMBIO_ESTADO_MATRICULA",
  "CAMBIO_TIPO_ORGANIZACION",
  "APERTURA_ESTABLECIMIENTO",
  "OTRO_REGISTRAL",
  "NOTICIA",
  "NOMBRAMIENTO",
  "CAMBIO_PARTICIPACION",
]);

const optionalNumber = z.coerce.number().finite().optional();

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Ingresa el correo."),
  password: z.string().min(1, "Ingresa la contraseña."),
});

export const companyQuerySchema = z.object({
  q: z.string().optional(),
  tipoRegistro: z.enum(["MERCANTIL", "ESAL"]).optional(),
  estadoMatricula: z.enum(["ACTIVA", "SUSPENDIDA", "CANCELADA", "INACTIVA"]).optional(),
  municipio: z.string().optional(),
  actividad: z.string().optional(),
  tamanoEmpresa: z.enum(["MICRO", "PEQUENA", "MEDIANA", "GRANDE"]).optional(),
  departamento: z.string().optional(),
  sector: z.enum(SECTOR_CODIGOS).optional(),
  empleadosMin: optionalNumber,
  empleadosMax: optionalNumber,
  ingresosMin: optionalNumber,
  ingresosMax: optionalNumber,
  activosMin: optionalNumber,
  activosMax: optionalNumber,
  unspsc: z.string().trim().optional(),
  monitoreada: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  sort: z.enum(["razonSocial", "nit", "sector", "municipio", "revenue", "totalAssets", "employees", "estadoMatricula"]).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
});

export const alertQuerySchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
  companyId: z.string().optional(),
  q: z.string().optional(),
  tipo: tipoEventoSchema.optional(),
  severidad: z.enum(["INFORMATIVA", "ATENCION", "IMPORTANTE"]).optional(),
  leida: z.enum(["true", "false"]).optional(),
});

export const monitoringQuerySchema = z.object({
  q: z.string().optional(),
  estadoMatricula: z.enum(["ACTIVA", "SUSPENDIDA", "CANCELADA", "INACTIVA"]).optional(),
});

export const dashboardQuerySchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
  tipoRegistro: z.enum(["MERCANTIL", "ESAL"]).optional(),
  municipio: z.string().optional(),
  departamento: z.string().optional(),
  estadoMatricula: z.enum(["ACTIVA", "SUSPENDIDA", "CANCELADA", "INACTIVA"]).optional(),
  sector: z.enum(SECTOR_CODIGOS).optional(),
  tamanoEmpresa: z.enum(["MICRO", "PEQUENA", "MEDIANA", "GRANDE"]).optional(),
});

export const savedSearchSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres.").max(80, "El nombre admite hasta 80 caracteres."),
  filtros: companyQuerySchema,
});

export const watchlistCompanySchema = z.object({
  companyId: z.string().min(1, "Selecciona una empresa."),
});

export const comparadorQuerySchema = z.object({
  ids: z.string().optional(),
});

export const monitorBodySchema = z.object({
  companyId: z.string().min(1, "Selecciona una empresa."),
});

export const readAlertSchema = z.object({
  leida: z.literal(true),
});

export const createUserSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresa el nombre completo."),
  email: z.string().trim().email("Ingresa un correo válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  rol: z.enum(ROL_CODIGOS),
});

export const updateUserSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresa el nombre completo.").optional(),
  rol: z.enum(ROL_CODIGOS).optional(),
  activo: z.boolean().optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").optional(),
});

export const settingSchema = z.object({
  clave: z.enum(["plataforma.nombre", "camara.nombre", "demo.aviso"]),
  valor: z.string().trim().min(1, "El valor no puede quedar vacío."),
});

export function readQuery(request: Request): Record<string, string> {
  const params = new URL(request.url).searchParams;
  const query: Record<string, string> = {};
  params.forEach((value, key) => {
    if (value.trim()) {
      query[key] = value.trim();
    }
  });
  return query;
}
