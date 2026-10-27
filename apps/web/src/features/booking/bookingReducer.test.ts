import type { Barber, Service } from "../../types";
import { bookingReducer, canVisit, initialBookingState } from "./bookingReducer";
import { validateCustomer } from "./validateCustomer";

const service: Service = { id: 2, name: "Corte clásico", description: "", durationMinutes: 30, priceClp: 10000, active: true };
const otherService: Service = { ...service, id: 5, name: "Corte + barba", durationMinutes: 60 };
const barber: Barber = { id: 1, name: "Matías Rojas", specialty: "Fade", active: true };

function filledState() {
  let state = initialBookingState("2026-11-02");
  state = bookingReducer(state, { type: "selectService", service });
  state = bookingReducer(state, { type: "selectBarber", barber });
  return bookingReducer(state, { type: "selectTime", time: "15:00" });
}

describe("flujo de reserva", () => {
  it("no permite saltar pasos sin completar los anteriores", () => {
    const state = initialBookingState("2026-11-02");
    expect(canVisit(state, 2)).toBe(false);
    expect(bookingReducer(state, { type: "goTo", step: 2 }).step).toBe(0);
  });

  it("avanza cuando los pasos previos están completos", () => {
    expect(bookingReducer(filledState(), { type: "goTo", step: 3 }).step).toBe(3);
  });

  it("descarta la hora elegida al cambiar servicio, barbero o día", () => {
    const state = filledState();
    expect(bookingReducer(state, { type: "selectService", service: otherService }).time).toBeNull();
    expect(bookingReducer(state, { type: "selectBarber", barber: { ...barber, id: 2 } }).time).toBeNull();
    expect(bookingReducer(state, { type: "selectDate", date: "2026-11-03" }).time).toBeNull();
    expect(bookingReducer(state, { type: "selectService", service }).time).toBe("15:00");
  });

  it("vuelve a elegir hora si el horario fue tomado por otro cliente", () => {
    const state = bookingReducer(filledState(), { type: "goTo", step: 3 });
    const next = bookingReducer(state, { type: "slotTaken" });
    expect(next).toMatchObject({ step: 2, time: null });
  });

  it("reinicia el flujo completo", () => {
    const next = bookingReducer(filledState(), { type: "restart", date: "2026-11-05" });
    expect(next).toEqual(initialBookingState("2026-11-05"));
  });
});

describe("validación de datos del cliente", () => {
  it("acepta datos válidos con correo opcional vacío", () => {
    expect(validateCustomer({ name: "Ana Pérez", rut: "12.345.678-5", phone: "9 1234 5678", email: "" })).toEqual({});
  });

  it("informa cada campo con error", () => {
    const errors = validateCustomer({ name: "Ana", rut: " ", phone: "", email: "ana@" });
    expect(Object.keys(errors).sort()).toEqual(["email", "name", "phone", "rut"]);
  });
});
