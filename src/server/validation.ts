import { z } from "zod";

import { ROL_CODIGOS } from "@/shared/types/domain";

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
});

export const alertQuerySchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
  companyId: z.string().optional(),
  q: z.string().optional(),
  tipo: z
    .enum([
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
    ])
    .optional(),
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
  estadoMatricula: z.enum(["ACTIVA", "SUSPENDIDA", "CANCELADA", "INACTIVA"]).optional(),
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
