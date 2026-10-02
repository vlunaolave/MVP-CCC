import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CompaniesScreen } from "@/features/companies/components/companies-screen";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("q=INNOVA VALLE"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/empresas",
}));

vi.mock("@/shared/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: {
        items: [
          {
            id: "co-innova",
            nit: "901847263-1",
            razonSocial: "INNOVA VALLE S.A.S.",
            nombreComercial: "Innova Valle",
            tipoRegistro: "MERCANTIL",
            tipoOrganizacion: "S.A.S.",
            actividadEconomicaCodigo: "6201",
            actividadEconomicaDescripcion: "Actividades de desarrollo de sistemas informáticos",
            municipio: "Cali",
            departamento: "Valle del Cauca",
            estadoMatricula: "ACTIVA",
            tamanoEmpresa: "MEDIANA",
            fechaUltimaActualizacion: "2026-03-02T12:00:00.000Z",
            monitoreada: true,
          },
        ],
        total: 1,
        disponibles: 22,
        recientes: [],
        opciones: { municipios: ["Cali"], actividades: [] },
      },
    }),
  },
  apiErrorMessage: () => "error",
}));

describe("búsqueda de empresas", () => {
  it("muestra INNOVA VALLE cuando la consulta coincide", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CompaniesScreen />
      </QueryClientProvider>,
    );
    expect((await screen.findAllByText("INNOVA VALLE S.A.S.")).length).toBeGreaterThan(0);
  });
});
