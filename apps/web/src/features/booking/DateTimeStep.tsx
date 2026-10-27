import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { useRemote } from "../../hooks/useRemote";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { isClosedDay, todayInShop, upcomingDays } from "../../lib/dates";
import { dayParts, formatLongDate } from "../../lib/format";
import { SHOP } from "../../lib/shop";
import type { Barber, Service, Slot } from "../../types";
import { StepFrame } from "./StepFrame";

interface DateTimeStepProps {
  service: Service;
  barber: Barber;
  date: string;
  time: string | null;
  notice?: string | null;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const MIDDAY = "13:00";

export function DateTimeStep({
  service,
  barber,
  date,
  time,
  notice,
  onSelectDate,
  onSelectTime,
  onBack,
  onContinue
}: DateTimeStepProps) {
  const days = upcomingDays(todayInShop(), SHOP.bookingDaysAhead);
  const { data, error, loading, reload } = useRemote(
    () => api.availability(barber.id, service.id, date),
    [barber.id, service.id, date]
  );

  const slots = data?.slots ?? [];
  const morning = slots.filter((slot) => slot.time < MIDDAY);
  const afternoon = slots.filter((slot) => slot.time >= MIDDAY);
  const hasAvailable = slots.some((slot) => slot.available);

  return (
    <StepFrame
      title="Elige día y hora"
      description={`Horas libres de ${barber.name} para ${service.name.toLowerCase()}.`}
      primaryLabel="Ingresar mis datos"
      primaryDisabled={!time}
      onPrimary={onContinue}
      onBack={onBack}
      totalClp={service.priceClp}
    >
      {notice && <Alert>{notice}</Alert>}

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Día</legend>
        <div className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {days.map((day) => {
            const closed = isClosedDay(day);
            const parts = dayParts(day);
            return (
              <label
                key={day}
                className={cn(
                  "grid w-16 shrink-0 snap-start justify-items-center rounded-lg border-2 py-2 transition-colors",
                  "has-focus-visible:ring-2 has-focus-visible:ring-barbicide has-focus-visible:ring-offset-2",
                  closed
                    ? "cursor-not-allowed border-dashed border-line text-steel-light"
                    : "cursor-pointer border-line bg-white hover:border-steel-light has-checked:border-graphite has-checked:bg-graphite has-checked:text-white"
                )}
              >
                <input
                  type="radio"
                  name="day"
                  value={day}
                  checked={date === day}
                  disabled={closed}
                  onChange={() => onSelectDate(day)}
                  className="sr-only"
                />
                <span className="text-xs capitalize">{parts.weekday}</span>
                <span className="font-display text-3xl leading-none font-bold tabular-nums">{parts.day}</span>
                <span className="text-xs">{closed ? "Cerrado" : parts.month}</span>
                <span className="sr-only">{formatLongDate(day)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-5" aria-live="polite" aria-busy={loading}>
        {error && (
          <div className="grid justify-items-start gap-3">
            <Alert>{error.message}</Alert>
            <Button variant="secondary" onClick={reload}>
              Reintentar
            </Button>
          </div>
        )}

        {loading && <div className="h-40 animate-pulse rounded-xl bg-porcelain-deep" aria-hidden="true" />}

        {!loading && data && (data.closed || !hasAvailable) && (
          <p className="rounded-xl border-2 border-dashed border-line px-5 py-6 text-steel">
            {data.closed
              ? "Los domingos la barbería está cerrada. Elige otro día."
              : `${barber.name} no tiene horas libres este día. Prueba con otro día u otro barbero.`}
          </p>
        )}

        {!loading && hasAvailable && (
          <fieldset className="grid gap-5">
            <legend className="sr-only">Hora para el {formatLongDate(date)}</legend>
            <SlotGroup label="Mañana" slots={morning} selected={time} onSelect={onSelectTime} />
            <SlotGroup label="Tarde" slots={afternoon} selected={time} onSelect={onSelectTime} />
          </fieldset>
        )}
      </div>
    </StepFrame>
  );
}

interface SlotGroupProps {
  label: string;
  slots: Slot[];
  selected: string | null;
  onSelect: (time: string) => void;
}

function SlotGroup({ label, slots, selected, onSelect }: SlotGroupProps) {
  if (slots.length === 0) return null;

  return (
    <div className="grid gap-3">
      <h3 className="font-sans text-sm font-semibold">{label}</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
        {slots.map((slot) => (
          <label
            key={slot.time}
            className={cn(
              "grid min-h-12 place-items-center rounded-full border-2 font-semibold tabular-nums transition-colors",
              "has-focus-visible:ring-2 has-focus-visible:ring-barbicide has-focus-visible:ring-offset-2",
              slot.available
                ? "cursor-pointer border-line bg-white hover:border-barbicide has-checked:border-barbicide has-checked:bg-barbicide has-checked:text-white"
                : "cursor-not-allowed border-transparent bg-porcelain-deep text-steel-light line-through"
            )}
          >
            <input
              type="radio"
              name="time"
              value={slot.time}
              checked={selected === slot.time}
              disabled={!slot.available}
              onChange={() => onSelect(slot.time)}
              className="sr-only"
            />
            {slot.time}
            {!slot.available && <span className="sr-only"> (ocupada)</span>}
          </label>
        ))}
      </div>
    </div>
  );
}
