import type { Barber, Booking, CustomerData, Service } from "../../types";

export const STEPS = ["Servicio", "Barbero", "Fecha y hora", "Tus datos"] as const;
export type StepIndex = 0 | 1 | 2 | 3;

export interface BookingState {
  step: StepIndex;
  service: Service | null;
  barber: Barber | null;
  date: string;
  time: string | null;
  customer: CustomerData;
  confirmed: Booking | null;
}

export type BookingAction =
  | { type: "selectService"; service: Service }
  | { type: "selectBarber"; barber: Barber }
  | { type: "selectDate"; date: string }
  | { type: "selectTime"; time: string }
  | { type: "updateCustomer"; customer: Partial<CustomerData> }
  | { type: "goTo"; step: StepIndex }
  | { type: "slotTaken" }
  | { type: "confirmed"; booking: Booking }
  | { type: "restart"; date: string };

export const emptyCustomer: CustomerData = { name: "", rut: "", phone: "", email: "" };

export function initialBookingState(date: string): BookingState {
  return { step: 0, service: null, barber: null, date, time: null, customer: emptyCustomer, confirmed: null };
}

export function isStepComplete(state: BookingState, step: StepIndex): boolean {
  switch (step) {
    case 0:
      return state.service !== null;
    case 1:
      return state.barber !== null;
    case 2:
      return state.time !== null;
    case 3:
      return state.confirmed !== null;
  }
}

export function canVisit(state: BookingState, step: StepIndex): boolean {
  for (let previous = 0; previous < step; previous++) {
    if (!isStepComplete(state, previous as StepIndex)) return false;
  }
  return true;
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "selectService":
      return {
        ...state,
        service: action.service,
        time: state.service?.id === action.service.id ? state.time : null
      };
    case "selectBarber":
      return {
        ...state,
        barber: action.barber,
        time: state.barber?.id === action.barber.id ? state.time : null
      };
    case "selectDate":
      return { ...state, date: action.date, time: state.date === action.date ? state.time : null };
    case "selectTime":
      return { ...state, time: action.time };
    case "updateCustomer":
      return { ...state, customer: { ...state.customer, ...action.customer } };
    case "goTo":
      return canVisit(state, action.step) ? { ...state, step: action.step } : state;
    case "slotTaken":
      return { ...state, step: 2, time: null };
    case "confirmed":
      return { ...state, confirmed: action.booking };
    case "restart":
      return initialBookingState(action.date);
  }
}
