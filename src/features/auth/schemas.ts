import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, "Ingresa el correo."),
  password: z.string().min(1, "Ingresa la contraseña."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
