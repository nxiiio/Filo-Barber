import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { ADMIN, createTestContext, MONDAY, VALID_CUSTOMER, type TestContext } from "../helpers.js";

function newBooking(overrides: Record<string, unknown> = {}) {
  return {
    barberId: 1,
    serviceId: 2,
    date: MONDAY,
    startTime: "15:00",
    customer: VALID_CUSTOMER,
    privacyConsent: true,
    ...overrides
  };
}

describe("API HTTP", () => {
  let ctx: TestContext;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    ctx = await createTestContext();
    app = createApp(ctx, { logErrors: false });
  });

  afterEach(async () => {
    await ctx.dataSource.destroy();
  });

  async function adminToken(): Promise<string> {
    const response = await request(app).post("/api/auth/login").send(ADMIN);
    return response.body.data.token;
  }

  describe("público", () => {
    it("responde el estado del servicio", async () => {
      const response = await request(app).get("/api/health");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "ok" });
    });

    it("lista servicios y barberos activos", async () => {
      const services = await request(app).get("/api/services");
      const barbers = await request(app).get("/api/barbers");
      expect(services.body.data).toHaveLength(5);
      expect(barbers.body.data).toHaveLength(3);
    });

    it("devuelve la disponibilidad de un barbero", async () => {
      const response = await request(app).get("/api/availability").query({ barberId: 1, serviceId: 2, date: MONDAY });
      expect(response.status).toBe(200);
      expect(response.body.data.slots.length).toBeGreaterThan(0);
    });

    it("valida los parámetros de disponibilidad", async () => {
      const response = await request(app).get("/api/availability").query({ barberId: "x", date: "02-11-2026" });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual(
        expect.arrayContaining(["barberId", "serviceId", "date"])
      );
    });

    it("crea una reserva y la recupera con código y RUT", async () => {
      const created = await request(app).post("/api/appointments").send(newBooking());
      expect(created.status).toBe(201);

      const { code } = created.body.data;
      const found = await request(app).get(`/api/appointments/${code}`).query({ rut: VALID_CUSTOMER.rut });
      expect(found.status).toBe(200);
      expect(found.body.data).toMatchObject({ code, status: "confirmed" });
      expect(found.body.data).not.toHaveProperty("customerRut");
    });

    it("exige el consentimiento para el uso de datos", async () => {
      const response = await request(app).post("/api/appointments").send(newBooking({ privacyConsent: false }));
      expect(response.status).toBe(400);
    });

    it("responde 409 cuando el horario ya está tomado", async () => {
      await request(app).post("/api/appointments").send(newBooking());
      const response = await request(app)
        .post("/api/appointments")
        .send(newBooking({ customer: { ...VALID_CUSTOMER, rut: "12.345.678-5" } }));
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("SLOT_UNAVAILABLE");
    });

    it("responde 422 fuera del horario de atención", async () => {
      const response = await request(app).post("/api/appointments").send(newBooking({ startTime: "21:00" }));
      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe("OUTSIDE_BUSINESS_HOURS");
    });

    it("no revela reservas a quien no tiene el RUT correcto", async () => {
      const created = await request(app).post("/api/appointments").send(newBooking());
      const response = await request(app)
        .get(`/api/appointments/${created.body.data.code}`)
        .query({ rut: "12.345.678-5" });
      expect(response.status).toBe(404);
    });

    it("cancela una reserva", async () => {
      const created = await request(app).post("/api/appointments").send(newBooking());
      const response = await request(app)
        .post(`/api/appointments/${created.body.data.code}/cancel`)
        .send({ rut: VALID_CUSTOMER.rut });
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("cancelled");
    });

    it("rechaza JSON mal formado sin exponer detalles internos", async () => {
      const response = await request(app)
        .post("/api/appointments")
        .set("Content-Type", "application/json")
        .send("{ no es json");
      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).not.toMatch(/at |stack/i);
    });

    it("devuelve 404 en JSON para rutas desconocidas", async () => {
      const response = await request(app).get("/api/no-existe");
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });

    it("envía cabeceras de seguridad", async () => {
      const response = await request(app).get("/api/health");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["content-security-policy"]).toBeDefined();
      expect(response.headers["x-powered-by"]).toBeUndefined();
    });
  });

  describe("administración", () => {
    it("inicia sesión con credenciales válidas", async () => {
      const response = await request(app).post("/api/auth/login").send(ADMIN);
      expect(response.status).toBe(200);
      expect(response.body.data.token).toEqual(expect.any(String));
      expect(response.body.data.admin).not.toHaveProperty("passwordHash");
    });

    it("rechaza credenciales inválidas con el mismo mensaje para usuario o clave", async () => {
      const wrongPassword = await request(app).post("/api/auth/login").send({ ...ADMIN, password: "otra-clave" });
      const wrongUser = await request(app).post("/api/auth/login").send({ ...ADMIN, email: "nadie@test.cl" });
      expect(wrongPassword.status).toBe(401);
      expect(wrongUser.status).toBe(401);
      expect(wrongPassword.body.error.message).toBe(wrongUser.body.error.message);
    });

    it("bloquea intentos repetidos de inicio de sesión", async () => {
      const attempts = Array.from({ length: 11 }, () =>
        request(app).post("/api/auth/login").send({ ...ADMIN, password: "incorrecta" })
      );
      const responses = await Promise.all(attempts);
      expect(responses.some((response) => response.status === 429)).toBe(true);
    });

    it("protege las rutas de administración", async () => {
      const withoutToken = await request(app).get("/api/admin/agenda");
      const withForgedToken = await request(app).get("/api/admin/agenda").set("Authorization", "Bearer token.falso.123");
      expect(withoutToken.status).toBe(401);
      expect(withForgedToken.status).toBe(401);
    });

    it("muestra la agenda del día con su resumen", async () => {
      await request(app).post("/api/appointments").send(newBooking());
      const token = await adminToken();
      const response = await request(app).get("/api/admin/agenda").query({ date: MONDAY }).set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.data.summary).toMatchObject({ confirmed: 1, expectedRevenueClp: 10000 });
      expect(response.body.data.appointments[0].customer.rut).toBe("11111111-1");
    });

    it("cancela una reserva desde el panel", async () => {
      await request(app).post("/api/appointments").send(newBooking());
      const token = await adminToken();
      const agenda = await request(app).get("/api/admin/agenda").query({ date: MONDAY }).set("Authorization", `Bearer ${token}`);
      const id = agenda.body.data.appointments[0].id;

      const response = await request(app).post(`/api/admin/appointments/${id}/cancel`).set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("cancelled");
    });

    it("crea y actualiza servicios y barberos", async () => {
      const token = await adminToken();
      const auth = { Authorization: `Bearer ${token}` };

      const service = await request(app)
        .post("/api/admin/services")
        .set(auth)
        .send({ name: "Corte infantil", description: "Para menores de 12 años.", durationMinutes: 30, priceClp: 7000 });
      expect(service.status).toBe(201);
      expect(service.body.data.active).toBe(true);

      const updated = await request(app).patch(`/api/admin/services/${service.body.data.id}`).set(auth).send({ priceClp: 7500 });
      expect(updated.body.data.priceClp).toBe(7500);

      const barber = await request(app).post("/api/admin/barbers").set(auth).send({ name: "Ignacio Vera", specialty: "Diseños" });
      expect(barber.status).toBe(201);

      const disabled = await request(app).patch(`/api/admin/barbers/${barber.body.data.id}`).set(auth).send({ active: false });
      expect(disabled.body.data.active).toBe(false);

      const publicBarbers = await request(app).get("/api/barbers");
      expect(publicBarbers.body.data.map((item: { name: string }) => item.name)).not.toContain("Ignacio Vera");
    });

    it("valida los datos del catálogo", async () => {
      const token = await adminToken();
      const response = await request(app)
        .post("/api/admin/services")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "X", durationMinutes: -5, priceClp: "gratis" });
      expect(response.status).toBe(400);
    });

    it("responde 404 al actualizar un recurso inexistente", async () => {
      const token = await adminToken();
      const response = await request(app)
        .patch("/api/admin/services/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ priceClp: 1000 });
      expect(response.status).toBe(404);
    });
  });
});
