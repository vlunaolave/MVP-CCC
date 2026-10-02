import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/shared/lib/prisma";
import {
  OAuth2AuthProvider,
  OidcAuthProvider,
  SamlAuthProvider,
  type AuthProvider,
} from "@/server/auth/auth-provider";
import { InactiveAccountError, InvalidCredentialsError } from "@/server/errors";

export const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export class LocalCredentialsProvider implements AuthProvider {
  readonly id = "local" as const;

  async authenticate(input: unknown): Promise<{ userId: string }> {
    const parsed = credentialsSchema.safeParse(input);
    if (!parsed.success) {
      throw new InvalidCredentialsError();
    }
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!matches) {
      throw new InvalidCredentialsError();
    }
    if (!user.activo) {
      throw new InactiveAccountError();
    }
    await prisma.authIdentity.upsert({
      where: { proveedor_subject: { proveedor: "LOCAL", subject: user.id } },
      update: {},
      create: { userId: user.id, proveedor: "LOCAL", subject: user.id },
    });
    return { userId: user.id };
  }
}

export function getAuthProvider(id = process.env.AUTH_PROVIDER ?? "local"): AuthProvider {
  switch (id) {
    case "oidc":
      return new OidcAuthProvider();
    case "oauth2":
      return new OAuth2AuthProvider();
    case "saml":
      return new SamlAuthProvider();
    default:
      return new LocalCredentialsProvider();
  }
}
