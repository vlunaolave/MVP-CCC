import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CompaniesScreen } from "@/features/companies/components/companies-screen";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("q=empresa-inexistente"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/empresas",
}));

vi.mock("@/shared/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: {
        items: [],
        total: 0,
        disponibles: 22,
        recientes: [],
        opciones: { municipios: [], actividades: [] },
      },
    }),
  },
  apiErrorMessage: () => "error",
}));

describe("estado vacío", () => {
  it("explica que ninguna empresa coincide", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <CompaniesScreen />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Ninguna empresa coincide con la búsqueda.")).toBeInTheDocument();
  });
});
