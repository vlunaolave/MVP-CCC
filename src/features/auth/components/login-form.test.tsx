import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/features/auth/components/login-form";

vi.mock("@/shared/lib/api-client", () => ({
  apiClient: {
    post: vi.fn().mockRejectedValue(new Error("falló")),
  },
  apiErrorMessage: () => "Correo o contraseña incorrectos.",
}));

describe("login", () => {
  it("muestra el mensaje único cuando las credenciales fallan", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LoginForm />
      </QueryClientProvider>,
    );
    await user.type(screen.getByLabelText("Correo"), "admin@demo.ccc");
    await user.type(screen.getByLabelText("Contraseña"), "clave-mala");
    await user.click(screen.getByTestId("login-submit"));
    expect(await screen.findByTestId("login-error")).toHaveTextContent("Correo o contraseña incorrectos.");
  });
});
