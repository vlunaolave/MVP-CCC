import { createHmac, timingSafeEqual } from "node:crypto";

const DEMO_AUTH_SECRET = "ccc-demo-auth-secret-local-only";

function secret(): string {
  return process.env.AUTH_SECRET || DEMO_AUTH_SECRET;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function encodeSessionToken(userId: string, expiresAtMs: number): string {
  const body = Buffer.from(JSON.stringify({ sub: userId, exp: expiresAtMs })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSessionToken(token: string): { sub: string; exp: number } | null {
  const [body, signature] = token.split(".");
  if (!body || !signature || token.split(".").length !== 2) {
    return null;
  }
  const expected = sign(body);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const sub = "sub" in parsed ? parsed.sub : undefined;
    const exp = "exp" in parsed ? parsed.exp : undefined;
    if (typeof sub !== "string" || typeof exp !== "number" || exp < Date.now()) {
      return null;
    }
    return { sub, exp };
  } catch {
    return null;
  }
}
