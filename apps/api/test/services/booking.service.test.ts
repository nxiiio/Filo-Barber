import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BusinessException } from "../../src/exceptions/app-error.js";
import { Appointment } from "../../src/models/appointment.model.js";
import type { CreateBookingCommand } from "../../src/services/booking.service.js";
import { createTestContext, MONDAY, SUNDAY, TUESDAY, VALID_CUSTOMER, type TestContext } from "../helpers.js";

const CORTE_CLASICO = 2;
const CORTE_Y_BARBA = 5;
const MATIAS = 1;
const JOAQUIN = 2;

function book(ctx: TestContext, overrides: Partial<CreateBookingCommand> = {}) {
  return ctx.services.booking.createBooking({
    barberId: MATIAS,
    serviceId: CORTE_CLASICO,
    date: MONDAY,
    startTime: "15:00",
    customer: VALID_CUSTOMER,
    ...overrides
  });
}

async function expectBusinessError(action: Promise<unknown>, code: string) {
  const error = await action.then(
    () => null,
    (reason: unknown) => reason
  );
  expect(error).toBeInstanceOf(BusinessException);
  expect((error as BusinessException).code).toBe(code);
}

describe("BookingService", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.dataSource.destroy();
  });

  describe("disponibilidad", () => {
    it("muestra todos los bloques libres de un día hábil", async () => {
      const availability = await ctx.services.booking.getAvailability({ barberId: MATIAS, serviceId: CORTE_CLASICO, date: MONDAY });
      expect(availability.closed).toBe(false);
      expect(availability.slots).toHaveLength(20);
      expect(availability.slots.every((slot) => slot.available)).toBe(true);
    });

    it("informa que el domingo está cerrado", async () => {
      const availability = await ctx.services.booking.getAvailability({ barberId: MATIAS, serviceId: CORTE_CLASICO, date: SUNDAY });
      expect(availability).toEqual({ date: SUNDAY, closed: true, slots: [] });
    });

    it("bloquea los horarios que se solapan con una reserva según la duración", async () => {
      await book(ctx, { serviceId: CORTE_Y_BARBA, startTime: "15:00" });
      const { slots } = await ctx.services.booking.getAvailability({ barberId: MATIAS, serviceId: CORTE_Y_BARBA, date: MONDAY });
      const taken = slots.filter((slot) => !slot.available).map((slot) => slot.time);
      expect(taken).toEqual(["14:30", "15:00", "15:30"]);
    });

    it("no afecta la agenda de otro barbero", async () => {
      await book(ctx);
      const { slots } = await ctx.services.booking.getAvailability({ barberId: JOAQUIN, serviceId: CORTE_CLASICO, date: MONDAY });
      expect(slots.every((slot) => slot.available)).toBe(true);
    });

    it("marca como no disponibles los bloques que ya pasaron hoy", async () => {
      ctx.clock.set({ date: MONDAY, minutes: 12 * 60 + 10 });
      const { slots } = await ctx.services.booking.getAvailability({ barberId: MATIAS, serviceId: CORTE_CLASICO, date: MONDAY });
      expect(slots.find((slot) => slot.time === "12:00")?.available).toBe(false);
      expect(slots.find((slot) => slot.time === "12:30")?.available).toBe(true);
    });
  });

  describe("crear reserva", () => {
    it("crea la reserva con precio y hora de término calculados", async () => {
      const booking = await book(ctx, { serviceId: CORTE_Y_BARBA });
      expect(booking).toMatchObject({
        status: "confirmed",
        startTime: "15:00",
        endTime: "16:00",
        priceClp: 17000,
        serviceName: "Corte + barba",
        barberName: "Matías Rojas"
      });
      expect(booking.code).toMatch(/^[A-Z2-9]{6}$/);
    });

    it("normaliza los datos del cliente y registra el consentimiento", async () => {
      const { code } = await book(ctx);
      const stored = await ctx.dataSource.getRepository(Appointment).findOneByOrFail({ code });
      expect(stored.customer).toMatchObject({ rut: "11111111-1", phone: "9 1234 5678", email: "ana@correo.cl" });
      expect(stored.privacyAcceptedAt).toBe(stored.createdAt);
    });

    it("acepta un RUT y teléfono sin validar su formato", async () => {
      const { code } = await book(ctx, { customer: { ...VALID_CUSTOMER, rut: "11.111.111-2", phone: "22345678" } });
      const stored = await ctx.dataSource.getRepository(Appointment).findOneByOrFail({ code });
      expect(stored.customer).toMatchObject({ rut: "11111111-2", phone: "22345678" });
    });

    it("impide reservar un horario que se solapa con otra reserva del mismo barbero", async () => {
      await book(ctx, { serviceId: CORTE_Y_BARBA, startTime: "15:00" });
      await expectBusinessError(
        book(ctx, { startTime: "15:30", customer: { ...VALID_CUSTOMER, rut: "12.345.678-5" } }),
        "SLOT_UNAVAILABLE"
      );
    });

    it("acepta solo una reserva cuando varios clientes piden la misma hora a la vez", async () => {
      const ruts = ["12.345.678-5", "7.654.321-6", "10.000.013-K", "11.111.111-1"];
      const results = await Promise.allSettled(
        ruts.map((rut) => book(ctx, { customer: { ...VALID_CUSTOMER, rut } }))
      );
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    });

    it("permite que un cliente tenga varias reservas futuras", async () => {
      await book(ctx, { startTime: "11:00" });
      await book(ctx, { startTime: "12:00", date: TUESDAY });
      await expect(book(ctx, { startTime: "16:00" })).resolves.toMatchObject({ status: "confirmed" });
    });

    it("rechaza servicios o barberos inexistentes o inactivos", async () => {
      await expectBusinessError(book(ctx, { serviceId: 999 }), "NOT_FOUND");
      await ctx.services.catalog.updateBarber(MATIAS, { active: false });
      await expectBusinessError(book(ctx), "INACTIVE_RESOURCE");
    });
  });

  describe("consultar y cancelar", () => {
    it("encuentra la reserva solo con el código y el RUT correctos", async () => {
      const { code } = await book(ctx);
      expect((await ctx.services.booking.findBooking(code.toLowerCase(), "11111111-1")).code).toBe(code);
      await expectBusinessError(ctx.services.booking.findBooking(code, "12.345.678-5"), "NOT_FOUND");
      await expectBusinessError(ctx.services.booking.findBooking("ZZZZZZ", VALID_CUSTOMER.rut), "NOT_FOUND");
    });

    it("cancela y libera el horario", async () => {
      const { code } = await book(ctx);
      expect((await ctx.services.booking.cancelBooking(code, VALID_CUSTOMER.rut)).status).toBe("cancelled");

      const { slots } = await ctx.services.booking.getAvailability({ barberId: MATIAS, serviceId: CORTE_CLASICO, date: MONDAY });
      expect(slots.find((slot) => slot.time === "15:00")?.available).toBe(true);
    });

    it("no permite cancelar dos veces", async () => {
      const { code } = await book(ctx);
      await ctx.services.booking.cancelBooking(code, VALID_CUSTOMER.rut);
      await expectBusinessError(ctx.services.booking.cancelBooking(code, VALID_CUSTOMER.rut), "ALREADY_CANCELLED");
    });

    it("permite cancelar aunque falte poco para la hora", async () => {
      const { code } = await book(ctx);
      ctx.clock.set({ date: MONDAY, minutes: 14 * 60 + 50 });
      expect((await ctx.services.booking.cancelBooking(code, VALID_CUSTOMER.rut)).status).toBe("cancelled");
    });
  });
});

describe("AgendaService", () => {
  it("resume reservas e ingreso esperado del día, excluyendo canceladas", async () => {
    const ctx = await createTestContext();
    await book(ctx, { serviceId: CORTE_Y_BARBA, startTime: "11:00" });
    await book(ctx, { startTime: "15:00", barberId: JOAQUIN, customer: { ...VALID_CUSTOMER, rut: "12.345.678-5" } });

    const before = await ctx.services.agenda.getDailyAgenda(MONDAY);
    const second = before.appointments.find((item) => item.barberId === JOAQUIN)!;
    await ctx.services.agenda.cancel(second.id);

    expect((await ctx.services.agenda.getDailyAgenda(MONDAY)).summary).toEqual({
      date: MONDAY,
      confirmed: 1,
      cancelled: 1,
      expectedRevenueClp: 17000
    });
    await expectBusinessError(ctx.services.agenda.cancel(second.id), "ALREADY_CANCELLED");
    await expectBusinessError(ctx.services.agenda.cancel(9999), "NOT_FOUND");
    await ctx.dataSource.destroy();
  });
});

describe("CatalogService", () => {
  it("lista solo activos por defecto y todos cuando se pide", async () => {
    const ctx = await createTestContext();
    await ctx.services.catalog.updateService(CORTE_CLASICO, { active: false });

    expect(await ctx.services.catalog.listServices()).toHaveLength(4);
    expect(await ctx.services.catalog.listServices(true)).toHaveLength(5);
    await expectBusinessError(ctx.services.catalog.updateService(999, { priceClp: 1 }), "NOT_FOUND");
    await expectBusinessError(ctx.services.catalog.updateBarber(999, { active: false }), "NOT_FOUND");
    await ctx.dataSource.destroy();
  });
});
