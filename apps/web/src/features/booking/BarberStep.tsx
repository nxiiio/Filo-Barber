import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { useRemote } from "../../hooks/useRemote";
import { api } from "../../lib/api";
import { initials } from "../../lib/format";
import type { Barber } from "../../types";
import { ChoiceIndicator } from "./ChoiceIndicator";
import { StepFrame } from "./StepFrame";

interface BarberStepProps {
  selected: Barber | null;
  totalClp?: number;
  onSelect: (barber: Barber) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function BarberStep({ selected, totalClp, onSelect, onBack, onContinue }: BarberStepProps) {
  const { data: barbers, error, loading, reload } = useRemote(api.barbers, []);

  return (
    <StepFrame
      title="¿Con quién te atiendes?"
      description="Cada barbero maneja su propia agenda. Si tienes uno de confianza, elígelo acá."
      primaryLabel="Elegir fecha y hora"
      primaryDisabled={!selected}
      onPrimary={onContinue}
      onBack={onBack}
      totalClp={totalClp}
    >
      {error && (
        <div className="grid justify-items-start gap-3">
          <Alert>{error.message}</Alert>
          <Button variant="secondary" onClick={reload}>
            Reintentar
          </Button>
        </div>
      )}

      {loading && <div className="h-64 animate-pulse rounded-xl bg-porcelain-deep" aria-hidden="true" />}

      {barbers && (
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="sr-only">Barberos disponibles</legend>
          {barbers.map((barber) => (
            <label
              key={barber.id}
              className="group relative flex cursor-pointer items-start gap-4 rounded-xl border-2 border-line bg-white p-4 transition-colors hover:border-steel-light has-checked:border-barbicide has-checked:bg-barbicide-tint has-focus-visible:ring-2 has-focus-visible:ring-barbicide has-focus-visible:ring-offset-2 sm:flex-col sm:gap-5 sm:p-5"
            >
              <input
                type="radio"
                name="barber"
                value={barber.id}
                checked={selected?.id === barber.id}
                onChange={() => onSelect(barber)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="grid size-14 shrink-0 place-items-center rounded-full bg-graphite font-display text-2xl font-black text-white transition-colors group-has-checked:bg-barbicide sm:size-20 sm:text-4xl"
              >
                {initials(barber.name)}
              </span>
              <span className="grid flex-1 gap-0.5">
                <span className="font-display text-3xl leading-tight font-bold">{barber.name}</span>
                <span className="text-sm text-steel">{barber.specialty}</span>
              </span>
              <span className="absolute top-4 right-4">
                <ChoiceIndicator />
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </StepFrame>
  );
}
