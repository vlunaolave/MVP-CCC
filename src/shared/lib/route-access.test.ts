import { describe, expect, it } from "vitest";

import { hasPermission } from "@/shared/lib/permissions";
import { isRoleAllowed } from "@/shared/lib/route-access";

describe("acceso por rol", () => {
  it("niega administración al consultor", () => {
    expect(hasPermission("CONSULTOR", "admin.usuarios")).toBe(false);
    expect(isRoleAllowed("/administracion", "CONSULTOR")).toBe(false);
    expect(isRoleAllowed("/api/admin/usuarios", "CONSULTOR")).toBe(false);
  });

  it("permite el tablero a los tres roles y el monitoreo solo a analista y administrador", () => {
    expect(isRoleAllowed("/dashboard", "CONSULTOR")).toBe(true);
    expect(isRoleAllowed("/monitoreo", "ANALISTA")).toBe(true);
    expect(isRoleAllowed("/monitoreo", "CONSULTOR")).toBe(false);
    expect(isRoleAllowed("/listas", "CONSULTOR")).toBe(false);
    expect(isRoleAllowed("/listas", "ANALISTA")).toBe(true);
    expect(isRoleAllowed("/sectores", "CONSULTOR")).toBe(true);
    expect(isRoleAllowed("/administracion", "ADMINISTRADOR")).toBe(true);
  });
});
