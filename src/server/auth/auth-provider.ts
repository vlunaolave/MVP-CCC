import { AuthProviderNotEnabled } from "@/server/errors";

export interface AuthProvider {
  readonly id: "local" | "oidc" | "oauth2" | "saml";
  authenticate(input: unknown): Promise<{ userId: string }>;
}

export class OidcAuthProvider implements AuthProvider {
  readonly id = "oidc" as const;
  authenticate(): Promise<{ userId: string }> {
    return Promise.reject(new AuthProviderNotEnabled("oidc"));
  }
}

export class OAuth2AuthProvider implements AuthProvider {
  readonly id = "oauth2" as const;
  authenticate(): Promise<{ userId: string }> {
    return Promise.reject(new AuthProviderNotEnabled("oauth2"));
  }
}

export class SamlAuthProvider implements AuthProvider {
  readonly id = "saml" as const;
  authenticate(): Promise<{ userId: string }> {
    return Promise.reject(new AuthProviderNotEnabled("saml"));
  }
}
