import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";
import { formatClp, formatLongDate } from "../../lib/format";
import { STEPS, canVisit, type BookingState, type StepIndex } from "./bookingReducer";

interface BookingProgressProps {
  state: BookingState;
  onNavigate: (step: StepIndex) => void;
}

function stepValue(state: BookingState, step: StepIndex): string | null {
  switch (step) {
    case 0:
      return state.service?.name ?? null;
    case 1:
      return state.barber?.name ?? null;
    case 2:
      return state.time ? `${formatLongDate(state.date)}, ${state.time} h` : null;
    case 3:
      return null;
  }
}

export function BookingProgress({ state, onNavigate }: BookingProgressProps) {
  const progress = state.confirmed ? 1 : (state.step + 0.5) / STEPS.length;
  const poleStyle = { "--progress": progress } as CSSProperties;

  return (
    <aside
      aria-label="Progreso de la reserva"
      className="grid gap-3 lg:sticky lg:top-6 lg:grid-cols-[1.1rem_1fr] lg:gap-x-5 lg:self-start"
    >
      <div
        aria-hidden="true"
        style={poleStyle}
        className="relative h-3.5 overflow-hidden rounded-full border-2 border-graphite bg-white lg:row-span-3 lg:h-auto lg:min-h-80"
      >
        <div
          className={cn(
            "pole-stripes absolute inset-y-0 left-0 w-[calc(var(--progress)*100%)] transition-all duration-700 ease-out",
            "lg:inset-x-0 lg:top-0 lg:bottom-auto lg:h-[calc(var(--progress)*100%)] lg:w-full"
          )}
        />
      </div>

      <p className="text-sm lg:hidden" aria-live="polite">
        Paso {state.step + 1} de {STEPS.length}: <strong>{STEPS[state.step]}</strong>
      </p>

      <ol className="hidden lg:grid lg:content-start lg:gap-1">
        {STEPS.map((label, index) => {
          const step = index as StepIndex;
          const value = stepValue(state, step);
          const current = state.step === step && !state.confirmed;
          const reachable = canVisit(state, step) && !state.confirmed && !current;

          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => onNavigate(step)}
                disabled={!reachable}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "grid w-full gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors",
                  current && "bg-white shadow-[inset_3px_0_0_var(--color-barbicide)]",
                  reachable && "hover:bg-porcelain-deep",
                  !reachable && !current && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "font-display text-2xl leading-tight font-bold",
                    current || value ? "text-graphite" : "text-steel-light"
                  )}
                >
                  {label}
                </span>
                {value && <span className="text-sm text-steel">{value}</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {state.service && (
        <p className="hidden border-t border-line px-3 pt-4 lg:col-start-2 lg:grid">
          <span className="text-sm text-steel">Total, se paga en el local</span>
          <strong className="font-display text-4xl tabular-nums">{formatClp(state.service.priceClp)}</strong>
        </p>
      )}
    </aside>
  );
}
