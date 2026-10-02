import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { RoleGuard } from "@/shared/components/role-guard";
import { useUiStore } from "@/shared/lib/ui-store";

describe("RoleGuard", () => {
  beforeEach(() => {
    useUiStore.setState({
      user: {
        id: "user-3",
        email: "consultor@demo.ccc",
        nombre: "Sofía Delgado Ríos",
        rol: "CONSULTOR",
        permisos: ["inicio.ver", "empresas.consultar", "empresas.perfil", "dashboard.ver"],
        aviso: "",
        plataformaNombre: "Plataforma",
      },
      sidebarOpen: false,
    });
  });

  it("oculta administración al consultor", () => {
    render(
      <RoleGuard permission="admin.usuarios">
        <button type="button">Administrar</button>
      </RoleGuard>,
    );
    expect(screen.queryByRole("button", { name: "Administrar" })).not.toBeInTheDocument();
  });
});