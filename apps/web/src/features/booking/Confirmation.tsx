import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Button } from "../../components/Button";
import { formatClp, formatLongDate } from "../../lib/format";
import { SHOP } from "../../lib/shop";
import type { Booking } from "../../types";

interface ConfirmationProps {
  booking: Booking;
  onRestart: () => void;
}

export function Confirmation({ booking, onRestart }: ConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const details = [
    { label: "Servicio", value: booking.serviceName },
    { label: "Barbero", value: booking.barberName },
    { label: "Día", value: formatLongDate(booking.date) },
    { label: "Hora", value: `${booking.startTime} a ${booking.endTime} h` },
    { label: "Total en el local", value: formatClp(booking.priceClp) }
  ];

  return (
    <section aria-labelledby="confirmation-title" className="grid gap-8">
      <header className="grid gap-3">
        <h2 id="confirmation-title" ref={headingRef} tabIndex={-1} className="text-5xl focus-visible:ring-0">
          Listo, {booking.customerName.split(" ")[0]}. Tu hora está reservada.
        </h2>
        <p className="max-w-prose text-steel">
          Guarda este código. Junto con tu RUT te sirve para revisar o cancelar la reserva hasta{" "}
          {SHOP.cancellationHours} horas antes.
        </p>
      </header>

      <div className="grid overflow-hidden rounded-xl border-2 border-graphite bg-white sm:grid-cols-[auto_1fr]">
        <div className="grid content-center gap-1 bg-graphite px-6 py-6 text-white sm:px-8">
          <span className="text-sm text-steel-light">Código de reserva</span>
          <strong className="font-display text-6xl font-black tracking-[0.12em] tabular-nums select-all">
            {booking.code}
          </strong>
        </div>
        <dl className="grid gap-x-6 gap-y-3 px-6 py-6 sm:grid-cols-[auto_1fr] sm:px-8">
          {details.map((item) => (
            <div key={item.label} className="contents">
              <dt className="text-sm text-steel">{item.label}</dt>
              <dd className="-mt-2 font-semibold sm:mt-0">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-sm text-steel">
        Te esperamos en {SHOP.address}. Si vas a llegar tarde, llámanos al {SHOP.phone}.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onRestart}>Reservar otra hora</Button>
        <Link
          to="/mi-reserva"
          state={{ code: booking.code }}
          className="inline-flex min-h-12 items-center rounded-full px-4 font-semibold focus-visible:rounded-full"
        >
          Ver en Mi reserva
        </Link>
      </div>
    </section>
  );
}
