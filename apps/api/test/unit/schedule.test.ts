import { describe, expect, it } from "vitest";
import {
  addDays,
  candidateStarts,
  daysBetween,
  isWithinOpeningHours,
  openingHoursFor,
  rangesOverlap,
  toMinutes,
  toTime
} from "../../src/utils/schedule.js";
import { MONDAY, SATURDAY, SUNDAY } from "../helpers.js";

describe("Horario de atención", () => {
  it("abre de lunes a viernes de 10:00 a 20:00", () => {
    expect(openingHoursFor(MONDAY)).toEqual({ open: 600, close: 1200 });
  });

  it("abre el sábado de 10:00 a 18:00", () => {
    expect(openingHoursFor(SATURDAY)).toEqual({ open: 600, close: 1080 });
  });

  it("cierra los domingos", () => {
    expect(openingHoursFor(SUNDAY)).toBeNull();
    expect(candidateStarts(SUNDAY, 30)).toEqual([]);
  });

  it("genera bloques cada 30 minutos sin pasarse del cierre", () => {
    const starts = candidateStarts(SATURDAY, 60);
    expect(starts[0]).toBe(600);
    expect(starts.at(-1)).toBe(1020);
    expect(starts).toHaveLength(15);
  });

  it("valida que una reserva quepa dentro del horario y comience en un bloque", () => {
    expect(isWithinOpeningHours(MONDAY, { start: 600, end: 660 })).toBe(true);
    expect(isWithinOpeningHours(MONDAY, { start: 1170, end: 1230 })).toBe(false);
    expect(isWithinOpeningHours(MONDAY, { start: 570, end: 600 })).toBe(false);
    expect(isWithinOpeningHours(MONDAY, { start: 615, end: 645 })).toBe(false);
    expect(isWithinOpeningHours(SUNDAY, { start: 600, end: 630 })).toBe(false);
  });
});

describe("Rangos de tiempo", () => {
  it("detecta solapamiento considerando la duración del servicio", () => {
    expect(rangesOverlap({ start: 900, end: 960 }, { start: 930, end: 960 })).toBe(true);
    expect(rangesOverlap({ start: 900, end: 945 }, { start: 930, end: 960 })).toBe(true);
  });

  it("permite reservas contiguas", () => {
    expect(rangesOverlap({ start: 900, end: 930 }, { start: 930, end: 960 })).toBe(false);
  });

  it("convierte entre minutos y horas", () => {
    expect(toMinutes("15:30")).toBe(930);
    expect(toTime(930)).toBe("15:30");
    expect(toTime(605)).toBe("10:05");
  });

  it("calcula diferencias y sumas de días cruzando meses", () => {
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });
});
