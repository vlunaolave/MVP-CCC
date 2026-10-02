export const SESSION_COOKIE = "ccc_session";
export const ROLE_COOKIE = "ccc_role";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    expires,
    secure: process.env.NODE_ENV === "production",
  };
}
