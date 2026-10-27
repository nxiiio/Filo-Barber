import { useReducer, useRef, useState } from "react";
import { ApiError, api } from "../../lib/api";
import { firstOpenDay, todayInShop } from "../../lib/dates";
import { SHOP } from "../../lib/shop";
import { BarberStep } from "./BarberStep";
import { BookingProgress } from "./BookingProgress";
import { bookingReducer, initialBookingState, type StepIndex } from "./bookingReducer";
import { Confirmation } from "./Confirmation";
import { CustomerStep } from "./CustomerStep";
import { DateTimeStep } from "./DateTimeStep";
import { ServiceStep } from "./ServiceStep";
import type { CustomerErrors } from "./validateCustomer";

const SLOT_CONFLICTS = new Set(["SLOT_UNAVAILABLE", "BOOKING_IN_PAST"]);

function serverFieldErrors(error: ApiError): CustomerErrors {
  return Object.fromEntries(
    error.details
      .filter((detail) => detail.field.startsWith("customer."))
      .map((detail) => [detail.field.replace("customer.", ""), detail.message])
  );
}

export function BookingPage() {
  const [state, dispatch] = useReducer(bookingReducer, firstOpenDay(todayInShop()), initialBookingState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<CustomerErrors>({});
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);

  function goTo(step: StepIndex) {
    interacted.current = true;
    setSubmitError(null);
    dispatch({ type: "goTo", step });
    flowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit() {
    const { service, barber, time, date, customer } = state;
    if (!service || !barber || !time) return;

    setSubmitting(true);
    setSubmitError(null);
    setServerErrors({});
    try {
      const booking = await api.createBooking({
        serviceId: service.id,
        barberId: barber.id,
        date,
        startTime: time,
        customer,
        privacyConsent: true
      });
      dispatch({ type: "confirmed", booking });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      if (SLOT_CONFLICTS.has(error.code)) {
        setSlotNotice(`${error.message}. Elige otra hora.`);
        dispatch({ type: "slotTaken" });
      } else {
        setSubmitError(error.message);
        setServerErrors(serverFieldErrors(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setSlotNotice(null);
    dispatch({ type: "restart", date: firstOpenDay(todayInShop()) });
  }

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-10 pb-12 md:grid-cols-[1fr_auto] md:items-end md:pt-16">
          <div className="grid gap-5">
            <h1 className="text-sign font-black text-graphite">Reserva tu hora en {SHOP.name}</h1>
            <p className="max-w-lg text-lg text-steel">
              Elige el servicio, tu barbero y la hora que te acomode. La confirmación llega al tiro, con un código
              para revisar o cancelar.
            </p>
          </div>
          <dl className="grid min-w-64 gap-1 border-l-4 border-leather pl-5 text-sm">
            {SHOP.hours.map((entry) => (
              <div key={entry.days} className="flex justify-between gap-6">
                <dt className="text-steel">{entry.days}</dt>
                <dd className="font-semibold tabular-nums">{entry.time}</dd>
              </div>
            ))}
            <div className="mt-2">
              <dt className="sr-only">Dirección</dt>
              <dd>{SHOP.address}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div ref={flowRef} className="mx-auto grid max-w-6xl scroll-mt-4 gap-8 px-5 py-10 lg:grid-cols-[17rem_1fr] lg:gap-12">
        <BookingProgress state={state} onNavigate={goTo} />

        <div className="min-w-0">
          {state.confirmed ? (
            <Confirmation booking={state.confirmed} onRestart={restart} />
          ) : (
            <>
              {state.step === 0 && (
                <ServiceStep
                  selected={state.service}
                  onSelect={(service) => dispatch({ type: "selectService", service })}
                  onContinue={() => goTo(1)}
                  focusOnMount={interacted.current}
                />
              )}
              {state.step === 1 && (
                <BarberStep
                  selected={state.barber}
                  totalClp={state.service?.priceClp}
                  onSelect={(barber) => dispatch({ type: "selectBarber", barber })}
                  onBack={() => goTo(0)}
                  onContinue={() => goTo(2)}
                />
              )}
              {state.step === 2 && state.service && state.barber && (
                <DateTimeStep
                  service={state.service}
                  barber={state.barber}
                  date={state.date}
                  time={state.time}
                  notice={slotNotice}
                  onSelectDate={(date) => {
                    setSlotNotice(null);
                    dispatch({ type: "selectDate", date });
                  }}
                  onSelectTime={(time) => dispatch({ type: "selectTime", time })}
                  onBack={() => goTo(1)}
                  onContinue={() => {
                    setSlotNotice(null);
                    goTo(3);
                  }}
                />
              )}
              {state.step === 3 && state.service && state.time && (
                <CustomerStep
                  customer={state.customer}
                  date={state.date}
                  time={state.time}
                  totalClp={state.service.priceClp}
                  submitting={submitting}
                  submitError={submitError}
                  serverErrors={serverErrors}
                  onChange={(customer) => dispatch({ type: "updateCustomer", customer })}
                  onBack={() => goTo(2)}
                  onSubmit={submit}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
