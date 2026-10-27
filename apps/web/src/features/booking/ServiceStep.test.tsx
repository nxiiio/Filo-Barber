import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { api } from "../../lib/api";
import type { Service } from "../../types";
import { ServiceStep } from "./ServiceStep";

const SERVICES: Service[] = [
  { id: 1, name: "Perfilado de barba", description: "Líneas y rebaje.", durationMinutes: 30, priceClp: 8000, active: true },
  { id: 5, name: "Corte + barba", description: "Servicio completo.", durationMinutes: 60, priceClp: 17000, active: true }
];

describe("ServiceStep", () => {
  afterEach(() => vi.restoreAllMocks());

  it("muestra la pizarra de servicios y permite elegir uno", async () => {
    vi.spyOn(api, "services").mockResolvedValue(SERVICES);
    const onSelect = vi.fn();

    render(<ServiceStep selected={null} onSelect={onSelect} onContinue={vi.fn()} focusOnMount={false} />);

    const option = await screen.findByRole("radio", { name: /Corte \+ barba/ });
    expect(screen.getByText("1 h")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Elegir barbero" })).toBeDisabled();

    await userEvent.click(option);
    expect(onSelect).toHaveBeenCalledWith(SERVICES[1]);
  });

  it("habilita continuar cuando hay un servicio elegido", async () => {
    vi.spyOn(api, "services").mockResolvedValue(SERVICES);
    const onContinue = vi.fn();

    render(<ServiceStep selected={SERVICES[0]!} onSelect={vi.fn()} onContinue={onContinue} focusOnMount={false} />);
    await screen.findByRole("radio", { name: /Perfilado de barba/ });

    await userEvent.click(screen.getByRole("button", { name: "Elegir barbero" }));
    expect(onContinue).toHaveBeenCalled();
  });

  it("muestra el error y permite reintentar si falla la carga", async () => {
    const { ApiError } = await import("../../lib/api");
    const spy = vi
      .spyOn(api, "services")
      .mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "No pudimos conectarnos."))
      .mockResolvedValueOnce(SERVICES);

    render(<ServiceStep selected={null} onSelect={vi.fn()} onContinue={vi.fn()} focusOnMount={false} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectarnos.");
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("radio", { name: /Perfilado de barba/ })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
