import { addDays, firstOpenDay, isClosedDay, todayInShop, upcomingDays } from "./dates";
import { dayParts, formatClp, formatDuration, formatLongDate, formatPhone, initials } from "./format";

describe("formatos", () => {
  it("formatea pesos chilenos sin decimales", () => {
    expect(formatClp(17000).replace(/\s/g, "")).toBe("$17.000");
  });

  it("formatea duraciones", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });

  it("formatea celulares en grupos", () => {
    expect(formatPhone("912345678")).toBe("9 1234 5678");
    expect(formatPhone("+56912345678")).toBe("9 1234 5678");
    expect(formatPhone("912")).toBe("9 12");
  });

  it("obtiene iniciales", () => {
    expect(initials("Matías Rojas Pérez")).toBe("MR");
  });

  it("muestra fechas en español sin desfase de zona horaria", () => {
    expect(formatLongDate("2026-11-02")).toBe("Lunes, 2 de noviembre");
    expect(dayParts("2026-11-02")).toMatchObject({ day: 2 });
  });
});

describe("fechas de la barbería", () => {
  it("calcula el día actual en la zona horaria de Santiago", () => {
    expect(todayInShop(new Date("2026-11-03T02:00:00Z"))).toBe("2026-11-02");
  });

  it("reconoce los domingos como cerrados y salta al siguiente día hábil", () => {
    expect(isClosedDay("2026-11-08")).toBe(true);
    expect(firstOpenDay("2026-11-08")).toBe("2026-11-09");
    expect(firstOpenDay("2026-11-09")).toBe("2026-11-09");
  });

  it("genera los próximos días", () => {
    expect(upcomingDays("2026-10-30", 3)).toEqual(["2026-10-30", "2026-10-31", addDays("2026-10-30", 2)]);
  });
});
