import { describe, expect, it } from "vitest";
import {
  assertCanBook,
  minutesUntil,
  type BookingRequest
} from "../../src/rules/booking.rules.js";
import { BusinessException } from "../../src/exceptions/app-error.js";
import { MONDAY, SUNDAY } from "../helpers.js";

const NOW = { date: "2026-10-30", minutes: 9 * 60 };

function request(overrides: Partial<BookingRequest> = {}): BookingRequest {
  return {
    date: MONDAY,
    range: { start: 900, end: 960 },
    now: NOW,
    barberAgenda: [],
    ...overrides
  };
}

function codeOf(action: () => void): string | undefined {
  try {
    action();
    return undefined;
  } catch (error) {
    return error instanceof BusinessException ? error.code : "UNEXPECTED";
  }
}

describe("Política de reservas", () => {
  it("acepta una reserva válida", () => {
    expect(codeOf(() => assertCanBook(request()))).toBeUndefined();
  });

  it("rechaza reservas en el pasado", () => {
    expect(codeOf(() => assertCanBook(request({ date: "2026-10-29" })))).toBe("BOOKING_IN_PAST");
  });

  it("permite reservar el mismo día mientras la hora no haya pasado", () => {
    expect(codeOf(() => assertCanBook(request({ now: { date: MONDAY, minutes: 901 } })))).toBe("BOOKING_IN_PAST");
    expect(codeOf(() => assertCanBook(request({ now: { date: MONDAY, minutes: 900 } })))).toBeUndefined();
  });

  it("rechaza reservas más allá de la ventana permitida", () => {
    expect(codeOf(() => assertCanBook(request({ date: "2026-12-15" })))).toBe("BOOKING_TOO_FAR");
  });

  it("rechaza horarios fuera de atención o en domingo", () => {
    expect(codeOf(() => assertCanBook(request({ range: { start: 1170, end: 1230 } })))).toBe("OUTSIDE_BUSINESS_HOURS");
    expect(codeOf(() => assertCanBook(request({ date: SUNDAY })))).toBe("OUTSIDE_BUSINESS_HOURS");
  });

  it("impide el doble agendamiento de un barbero", () => {
    const barberAgenda = [{ start: 930, end: 990 }];
    expect(codeOf(() => assertCanBook(request({ barberAgenda })))).toBe("SLOT_UNAVAILABLE");
  });

  it("calcula los minutos hasta la reserva cruzando días", () => {
    expect(minutesUntil(NOW, "2026-10-31", 600)).toBe(24 * 60 + 60);
  });
});
