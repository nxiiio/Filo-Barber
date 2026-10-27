import { formatRut } from "./rut";

describe("RUT en el formulario", () => {
  it("formatea mientras se escribe", () => {
    expect(formatRut("1")).toBe("1");
    expect(formatRut("123456785")).toBe("12.345.678-5");
    expect(formatRut("10000013k")).toBe("10.000.013-K");
  });

  it("ignora caracteres no válidos y largo extra", () => {
    expect(formatRut("12.345.678-5xyz9")).toBe("12.345.678-5");
  });
});
