import { describe, expect, it } from "vitest";
import { computeVerifierDigit, normalizeRut } from "../../src/utils/rut.js";

describe("RUT", () => {
  it("calcula el dígito verificador incluyendo los casos 0 y K", () => {
    expect(computeVerifierDigit("12345678")).toBe("5");
    expect(computeVerifierDigit("10000013")).toBe("K");
    expect(computeVerifierDigit("6")).toBe("K");
    expect(computeVerifierDigit("11111111")).toBe("1");
  });

  it("normaliza puntos, espacios y mayúsculas al formato de almacenamiento", () => {
    expect(normalizeRut(" 12.345.678-5 ")).toBe("12345678-5");
    expect(normalizeRut("10000013k")).toBe("10000013-K");
  });

  it("no valida el dígito verificador ni rechaza formatos libres", () => {
    expect(normalizeRut("12.345.678-9")).toBe("12345678-9");
    expect(normalizeRut("no-es-rut")).toBe("NO-ES-RUT");
  });
});
