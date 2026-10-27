import { useState, type FormEvent } from "react";
import { useLocation } from "react-router";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { ApiError, api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { formatClp, formatLongDate } from "../../lib/format";
import { formatRut } from "../../lib/rut";
import { SHOP } from "../../lib/shop";
import type { Booking } from "../../types";

const NOT_FOUND_MESSAGE = "No encontramos una reserva con ese código y RUT. Revisa ambos datos.";

export function MyBookingPage() {
  const location = useLocation();
  const initialCode = (location.state as { code?: string } | null)?.code ?? "";

  const [code, setCode] = useState(initialCode);
  const [rut, setRut] = useState("");
  const [rutError, setRutError] = useState<string>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [justCancelled, setJustCancelled] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setJustCancelled(false);
    setConfirmingCancel(false);

    if (!rut.trim()) {
      setRutError("Ingresa tu RUT.");
      return;
    }

    setLoading(true);
    try {
      setBooking(await api.findBooking(code.trim(), rut));
    } catch (reason) {
      setBooking(null);
      if (!(reason instanceof ApiError)) throw reason;
      setError(reason.code === "NOT_FOUND" ? NOT_FOUND_MESSAGE : reason.message);
    } finally {
      setLoading(false);
    }
  }

  async function cancel() {
    if (!booking) return;
    setCancelling(true);
    setError(null);
    try {
      setBooking(await api.cancelBooking(booking.code, rut));
      setJustCancelled(true);
    } catch (reason) {
      if (!(reason instanceof ApiError)) throw reason;
      setError(reason.message);
    } finally {
      setCancelling(false);
      setConfirmingCancel(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-[minmax(0,26rem)_1fr] md:gap-16 md:py-16">
      <section aria-labelledby="lookup-title" className="grid content-start gap-6">
        <header className="grid gap-3">
          <h1 id="lookup-title" className="text-6xl font-black">
            Mi reserva
          </h1>
          <p className="text-steel">
            Ingresa el código que recibiste al reservar y tu RUT para revisar o cancelar tu hora.
          </p>
        </header>

        <form onSubmit={search} noValidate className="grid gap-5">
          <Field
            label="Código de reserva"
            name="code"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="ABC123"
            value={code}
            maxLength={12}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className="[&_input]:font-semibold [&_input]:tracking-[0.15em]"
          />
          <Field
            label="RUT"
            name="rut"
            placeholder="12.345.678-9"
            value={rut}
            error={rutError}
            onChange={(event) => {
              setRut(formatRut(event.target.value));
              setRutError(undefined);
            }}
          />
          <Button type="submit" loading={loading} disabled={code.trim().length < 4}>
            Buscar reserva
          </Button>
        </form>
      </section>

      <section aria-live="polite" className="grid content-start gap-5">
        {error && <Alert>{error}</Alert>}
        {justCancelled && <Alert tone="success">Reserva cancelada. La hora quedó libre para otro cliente.</Alert>}

        {booking ? (
          <BookingCard
            booking={booking}
            confirmingCancel={confirmingCancel}
            cancelling={cancelling}
            onAskCancel={() => setConfirmingCancel(true)}
            onKeep={() => setConfirmingCancel(false)}
            onCancel={cancel}
          />
        ) : (
          !error && (
            <div className="grid min-h-64 place-content-center rounded-xl border-2 border-dashed border-line p-8 text-center text-steel">
              <p>Tu reserva aparecerá acá.</p>
              <p className="text-sm">¿Perdiste el código? Llámanos al {SHOP.phone}.</p>
            </div>
          )
        )}
      </section>
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  confirmingCancel: boolean;
  cancelling: boolean;
  onAskCancel: () => void;
  onKeep: () => void;
  onCancel: () => void;
}

function BookingCard({ booking, confirmingCancel, cancelling, onAskCancel, onKeep, onCancel }: BookingCardProps) {
  const cancelled = booking.status === "cancelled";

  return (
    <article className={cn("grid gap-6 rounded-xl border-2 bg-white p-6 sm:p-8", cancelled ? "border-line" : "border-graphite")}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-sm text-steel">Reserva {booking.code}</span>
          <h2 className={cn("text-4xl", cancelled && "text-steel line-through decoration-2")}>{booking.serviceName}</h2>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold",
            cancelled ? "bg-porcelain-deep text-steel" : "bg-success-tint text-success"
          )}
        >
          {cancelled ? "Cancelada" : "Confirmada"}
        </span>
      </header>

      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <Detail label="Día" value={formatLongDate(booking.date)} />
        <Detail label="Hora" value={`${booking.startTime} a ${booking.endTime} h`} />
        <Detail label="Barbero" value={booking.barberName} />
        <Detail label="Total en el local" value={formatClp(booking.priceClp)} />
      </dl>

      {!cancelled && (
        <div className="border-t border-line pt-5">
          {confirmingCancel ? (
            <div className="grid gap-4" role="group" aria-label="Confirmar cancelación">
              <p className="font-semibold">¿Cancelar esta hora? La liberaremos para otro cliente.</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="danger" loading={cancelling} onClick={onCancel}>
                  Sí, cancelar reserva
                </Button>
                <Button variant="ghost" onClick={onKeep}>
                  Mantener reserva
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-steel">Puedes cancelar hasta {SHOP.cancellationHours} horas antes.</p>
              <Button variant="secondary" onClick={onAskCancel}>
                Cancelar reserva
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-sm text-steel">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
