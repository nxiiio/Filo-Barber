import { useRef, useState, type CSSProperties } from "react";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { useRemote } from "../../hooks/useRemote";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { addDays, todayInShop } from "../../lib/dates";
import { formatClp, formatLongDate } from "../../lib/format";
import type { AdminAppointment, Barber } from "../../types";
import { useAdminSession } from "./AdminSessionContext";

const OPEN_MINUTES = 10 * 60;
const CLOSE_MINUTES = 20 * 60;
const ROW_MINUTES = 30;
const ROWS = (CLOSE_MINUTES - OPEN_MINUTES) / ROW_MINUTES;

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function rowOf(time: string): number {
  return (toMinutes(time) - OPEN_MINUTES) / ROW_MINUTES + 1;
}

function rowLabel(row: number): string {
  const total = OPEN_MINUTES + row * ROW_MINUTES;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function AgendaPage() {
  const { guard } = useAdminSession();
  const [date, setDate] = useState(todayInShop());
  const [selected, setSelected] = useState<AdminAppointment | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const agenda = useRemote(() => guard((token) => api.agenda(token, date)), [date]);
  const barbers = useRemote(() => guard((token) => api.adminBarbers(token)), []);

  const appointments = agenda.data?.appointments ?? [];
  const visibleBarbers = (barbers.data ?? []).filter(
    (barber) => barber.active || appointments.some((appointment) => appointment.barberId === barber.id)
  );

  function open(appointment: AdminAppointment) {
    setSelected(appointment);
    setActionError(null);
    dialogRef.current?.showModal();
  }

  async function cancelSelected() {
    if (!selected) return;
    setCancelling(true);
    setActionError(null);
    try {
      await guard((token) => api.adminCancel(token, selected.id));
      dialogRef.current?.close();
      agenda.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo cancelar la reserva");
    } finally {
      setCancelling(false);
    }
  }

  const summary = agenda.data?.summary;

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid gap-1">
          <h1 className="text-6xl font-black">Agenda</h1>
          <p className="text-lg text-steel">{formatLongDate(date)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setDate(addDays(date, -1))} aria-label="Día anterior">
            Anterior
          </Button>
          <label className="sr-only" htmlFor="agenda-date">
            Fecha
          </label>
          <input
            id="agenda-date"
            type="date"
            value={date}
            onChange={(event) => event.target.value && setDate(event.target.value)}
            className="min-h-12 rounded-full border-2 border-line bg-white px-4 font-semibold"
          />
          <Button variant="secondary" onClick={() => setDate(addDays(date, 1))} aria-label="Día siguiente">
            Siguiente
          </Button>
          {date !== todayInShop() && (
            <Button variant="ghost" onClick={() => setDate(todayInShop())}>
              Hoy
            </Button>
          )}
        </div>
      </header>

      {summary && (
        <dl className="grid grid-cols-3 divide-x divide-line rounded-xl border-2 border-graphite bg-white">
          <Stat label="Reservas confirmadas" value={String(summary.confirmed)} />
          <Stat label="Canceladas" value={String(summary.cancelled)} />
          <Stat label="Ingreso esperado" value={formatClp(summary.expectedRevenueClp)} />
        </dl>
      )}

      {(agenda.error || barbers.error) && <Alert>{(agenda.error ?? barbers.error)?.message}</Alert>}

      {agenda.loading || barbers.loading ? (
        <div className="h-96 animate-pulse rounded-xl bg-porcelain-deep" aria-hidden="true" />
      ) : (
        <>
          <DayGrid
            barbers={visibleBarbers}
            appointments={appointments.filter((item) => item.status === "confirmed")}
            onOpen={open}
          />
          <CancelledList appointments={appointments.filter((item) => item.status === "cancelled")} onOpen={open} />
        </>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="appointment-title"
        className="m-auto w-[min(32rem,calc(100%-2.5rem))] rounded-xl bg-porcelain p-0 text-graphite backdrop:bg-graphite/60"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="grid gap-6 p-6 sm:p-8">
            <header className="grid gap-1">
              <span className="text-sm text-steel">
                {selected.startTime} a {selected.endTime} h, código {selected.code}
              </span>
              <h2 id="appointment-title" className="text-4xl">
                {selected.customer.name}
              </h2>
            </header>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-steel">Servicio</dt>
              <dd className="font-semibold">{selected.serviceName}</dd>
              <dt className="text-steel">Barbero</dt>
              <dd className="font-semibold">{selected.barberName}</dd>
              <dt className="text-steel">RUT</dt>
              <dd className="font-semibold tabular-nums">{selected.customer.rut}</dd>
              <dt className="text-steel">Celular</dt>
              <dd>
                <a href={`tel:${selected.customer.phone}`} className="font-semibold tabular-nums">
                  {selected.customer.phone}
                </a>
              </dd>
              {selected.customer.email && (
                <>
                  <dt className="text-steel">Correo</dt>
                  <dd className="font-semibold break-all">{selected.customer.email}</dd>
                </>
              )}
              <dt className="text-steel">Valor</dt>
              <dd className="font-semibold">{formatClp(selected.priceClp)}</dd>
            </dl>
            {actionError && <Alert>{actionError}</Alert>}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="ghost" onClick={() => dialogRef.current?.close()}>
                Cerrar
              </Button>
              {selected.status === "confirmed" && (
                <Button variant="danger" loading={cancelling} onClick={cancelSelected}>
                  Cancelar reserva
                </Button>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}

function CancelledList({ appointments, onOpen }: Pick<DayGridProps, "appointments" | "onOpen">) {
  if (appointments.length === 0) return null;

  return (
    <section aria-labelledby="cancelled-title" className="grid gap-3">
      <h2 id="cancelled-title" className="text-3xl">
        Canceladas este día
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {appointments.map((appointment) => (
          <li key={appointment.id}>
            <button
              type="button"
              onClick={() => onOpen(appointment)}
              className="grid w-full rounded-md border border-line bg-white px-4 py-3 text-left text-sm hover:border-steel-light"
            >
              <span className="font-semibold text-steel line-through">{appointment.customer.name}</span>
              <span className="text-xs text-steel">
                {appointment.startTime} h con {appointment.barberName}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-4 py-4 sm:px-6">
      <dt className="text-xs text-steel sm:text-sm">{label}</dt>
      <dd className="font-display text-3xl font-bold tabular-nums sm:text-5xl">{value}</dd>
    </div>
  );
}

interface DayGridProps {
  barbers: Barber[];
  appointments: AdminAppointment[];
  onOpen: (appointment: AdminAppointment) => void;
}

function DayGrid({ barbers, appointments, onOpen }: DayGridProps) {
  if (barbers.length === 0) {
    return <p className="text-steel">No hay barberos activos. Agrégalos en Servicios y barberos.</p>;
  }

  const gridStyle = {
    gridTemplateColumns: `4rem repeat(${barbers.length}, minmax(12rem, 1fr))`,
    gridTemplateRows: `auto repeat(${ROWS}, 3rem)`
  } satisfies CSSProperties;

  return (
    <div className="overflow-x-auto rounded-xl border-2 border-graphite bg-white">
      <div className="grid min-w-max" style={gridStyle}>
        <div className="sticky left-0 z-10 border-b-2 border-graphite bg-white" />
        {barbers.map((barber, index) => (
          <div
            key={barber.id}
            className="border-b-2 border-l border-graphite border-l-line px-4 py-3"
            style={{ gridColumn: index + 2, gridRow: 1 }}
          >
            <p className="font-display text-2xl leading-tight font-bold">{barber.name}</p>
            <p className="text-xs text-steel">
              {appointments.filter((item) => item.barberId === barber.id).length}{" "}
              reservas
            </p>
          </div>
        ))}

        {Array.from({ length: ROWS }, (_, row) => (
          <div
            key={row}
            className="sticky left-0 z-10 border-t border-line bg-white pt-1 pr-2 text-right text-xs text-steel tabular-nums"
            style={{ gridColumn: 1, gridRow: row + 2 }}
          >
            {row % 2 === 0 ? rowLabel(row) : ""}
          </div>
        ))}
        {barbers.map((barber, index) =>
          Array.from({ length: ROWS }, (_, row) => (
            <div
              key={`${barber.id}-${row}`}
              className={cn("border-l border-line", row % 2 === 0 ? "border-t" : "border-t border-t-porcelain-deep")}
              style={{ gridColumn: index + 2, gridRow: row + 2 }}
            />
          ))
        )}

        {appointments.map((appointment) => {
          const column = barbers.findIndex((barber) => barber.id === appointment.barberId);
          if (column === -1) return null;
          const start = rowOf(appointment.startTime) + 1;
          const end = Math.ceil(rowOf(appointment.endTime)) + 1;

          return (
            <button
              key={appointment.id}
              type="button"
              onClick={() => onOpen(appointment)}
              style={{ gridColumn: column + 2, gridRow: `${Math.floor(start)} / ${end}` }}
              className="z-[1] m-1 grid content-start overflow-hidden rounded-md border-l-4 border-barbicide bg-barbicide-tint px-3 py-1.5 text-left text-sm text-graphite transition-colors hover:bg-[#c3ddd9]"
            >
              <span className="font-semibold">{appointment.customer.name}</span>
              <span className="text-xs">
                {appointment.startTime} {appointment.serviceName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
