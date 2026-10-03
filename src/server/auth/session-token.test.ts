import { describe, expect, it } from "vitest";

import { decodeSessionToken, encodeSessionToken } from "@/server/auth/session-token";

describe("token de sesión", () => {
  it("conserva el usuario y la expiración", () => {
    process.env.AUTH_SECRET = "test-secret";
    const exp = Date.now() + 60_000;
    const token = encodeSessionToken("user-1", exp);
    expect(decodeSessionToken(token)).toEqual({ sub: "user-1", exp });
  });

  it("rechaza un token alterado o vencido", () => {
    process.env.AUTH_SECRET = "test-secret";
    const token = encodeSessionToken("user-1", Date.now() + 60_000);
    const [body, signature] = token.split(".");
    expect(decodeSessionToken(`${body}x.${signature}`)).toBeNull();
    expect(decodeSessionToken(encodeSessionToken("user-1", Date.now() - 1_000))).toBeNull();
    expect(decodeSessionToken("no-es-un-token")).toBeNull();
  });
});
