import { z } from "zod";

import { ROL_CODIGOS } from "@/shared/types/domain";

export const createUserFormSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresa el nombre completo."),
  email: z.string().trim().email("Ingresa un correo válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  rol: z.enum(ROL_CODIGOS),
});

export const editUserFormSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresa el nombre completo."),
  rol: z.enum(ROL_CODIGOS),
  activo: z.boolean(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").or(z.literal("")),
});

export const settingFormSchema = z.object({
  plataforma: z.string().trim().min(1, "El nombre no puede quedar vacío."),
  camara: z.string().trim().min(1, "El nombre no puede quedar vacío."),
  aviso: z.string().trim().min(1, "El aviso no puede quedar vacío."),
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
export type EditUserFormValues = z.infer<typeof editUserFormSchema>;
