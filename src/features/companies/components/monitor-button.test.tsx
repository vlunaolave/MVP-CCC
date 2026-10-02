import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { MonitorButton } from "@/features/companies/components/monitor-button";
import { useUiStore } from "@/shared/lib/ui-store";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/shared/lib/api-client", () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ data: { ok: true } }),
    delete: vi.fn(),
  },
  apiErrorMessage: () => "No se pudo agregar la empresa.",
}));

describe("monitoreo", () => {
  beforeEach(() => {
    useUiStore.setState({
      user: {
        id: "user-1",
        email: "analista@demo.ccc",
        nombre: "Julián Herrera Mejía",
        rol: "ANALISTA",
        permisos: ["empresas.monitorear"],
        aviso: "",
        plataformaNombre: "Plataforma",
      },
      sidebarOpen: false,
    });
  });

  it("confirma con el toast exacto al agregar una empresa", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MonitorButton companyId="co-innova" monitoreada={false} />
      </QueryClientProvider>,
    );
    await user.click(screen.getByTestId("company-monitor"));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Empresa agregada al monitoreo correctamente.");
    });
  });
});
