import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { useRemote } from "../../hooks/useRemote";
import { api } from "../../lib/api";
import { formatClp, formatDuration } from "../../lib/format";
import type { Service } from "../../types";
import { ChoiceIndicator } from "./ChoiceIndicator";
import { StepFrame } from "./StepFrame";

interface ServiceStepProps {
  selected: Service | null;
  onSelect: (service: Service) => void;
  onContinue: () => void;
  focusOnMount: boolean;
}

export function ServiceStep({ selected, onSelect, onContinue, focusOnMount }: ServiceStepProps) {
  const { data: services, error, loading, reload } = useRemote(api.services, []);

  return (
    <StepFrame
      title="Elige tu servicio"
      description="Todos los precios incluyen lavado. Se paga en el local, en efectivo o tarjeta."
      primaryLabel="Elegir barbero"
      primaryDisabled={!selected}
      onPrimary={onContinue}
      totalClp={selected?.priceClp}
      focusOnMount={focusOnMount}
    >
      {error && (
        <div className="grid justify-items-start gap-3">
          <Alert>{error.message}</Alert>
          <Button variant="secondary" onClick={reload}>
            Reintentar
          </Button>
        </div>
      )}

      {loading && <BoardSkeleton />}

      {services && (
        <fieldset className="overflow-hidden rounded-xl border-2 border-graphite bg-white">
          <legend className="sr-only">Servicios disponibles</legend>
          {services.map((service) => (
            <label
              key={service.id}
              className="group flex cursor-pointer gap-4 border-b border-line px-4 py-4 transition-colors last:border-b-0 hover:bg-porcelain has-checked:bg-barbicide-tint has-focus-visible:ring-2 has-focus-visible:ring-barbicide has-focus-visible:ring-inset sm:px-6"
            >
              <input
                type="radio"
                name="service"
                value={service.id}
                checked={selected?.id === service.id}
                onChange={() => onSelect(service)}
                className="sr-only"
              />
              <ChoiceIndicator />
              <span className="grid min-w-0 flex-1 gap-1">
                <span className="flex items-baseline gap-3">
                  <span className="font-display text-2xl leading-tight font-bold sm:text-3xl">{service.name}</span>
                  <span aria-hidden="true" className="leader-dots hidden h-4 flex-1 sm:block" />
                  <span className="ml-auto shrink-0 font-display text-2xl font-bold tabular-nums sm:ml-0 sm:text-3xl">
                    {formatClp(service.priceClp)}
                  </span>
                </span>
                <span className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm text-steel">
                  <span>{service.description}</span>
                  <span className="shrink-0 tabular-nums">{formatDuration(service.durationMinutes)}</span>
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </StepFrame>
  );
}

function BoardSkeleton() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border-2 border-line bg-line" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="h-21 animate-pulse bg-white" />
      ))}
    </div>
  );
}
