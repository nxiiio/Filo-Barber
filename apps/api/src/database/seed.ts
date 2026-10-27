import type { DataSource } from "typeorm";
import { AdminUser } from "../models/admin-user.model.js";
import { Appointment, AppointmentStatus } from "../models/appointment.model.js";
import { Barber } from "../models/barber.model.js";
import { Service } from "../models/service.model.js";
import type { PasswordService } from "../security/password.service.js";
import type { Clock } from "../shared/clock.js";
import { computeVerifierDigit } from "../utils/rut.js";
import { addDays, openingHoursFor } from "../utils/schedule.js";

interface SeedOptions {
  adminEmail: string;
  adminPassword: string;
  passwordService: PasswordService;
  clock: Clock;
  withSampleBookings?: boolean;
}

const BARBERS = [
  { name: "Matías Rojas", specialty: "Fade y degradados" },
  { name: "Joaquín Soto", specialty: "Barba y afeitado clásico" },
  { name: "Camila Fuentes", specialty: "Cortes con tijera y diseño" }
];

const SERVICES = [
  { name: "Perfilado de barba", description: "Definición de líneas, rebaje y aceite hidratante.", durationMinutes: 30, priceClp: 8000 },
  { name: "Corte clásico", description: "Corte a tijera o máquina con lavado y peinado.", durationMinutes: 30, priceClp: 10000 },
  { name: "Afeitado tradicional", description: "Toalla caliente, navaja y bálsamo post afeitado.", durationMinutes: 45, priceClp: 12000 },
  { name: "Fade / degradado", description: "Degradado a navaja con terminaciones a mano alzada.", durationMinutes: 45, priceClp: 13000 },
  { name: "Corte + barba", description: "El servicio completo: corte, perfilado y toalla caliente.", durationMinutes: 60, priceClp: 17000 }
];

const SAMPLE_CUSTOMERS = [
  { name: "Diego Muñoz", body: "16543210", phone: "+56987654321" },
  { name: "Tomás Herrera", body: "18234567", phone: "+56976543210" },
  { name: "Benjamín Castro", body: "20111222", phone: "+56965432109" }
];

const SAMPLE_BOOKINGS = [
  { dayOffset: 1, barber: 0, service: 4, start: "11:00", end: "12:00", customer: 0 },
  { dayOffset: 1, barber: 1, service: 2, start: "12:00", end: "12:45", customer: 1 },
  { dayOffset: 1, barber: 2, service: 1, start: "16:30", end: "17:00", customer: 2 },
  { dayOffset: 2, barber: 0, service: 3, start: "10:00", end: "10:45", customer: 1 }
];

function nextOpenDay(from: string, offset: number): string {
  let date = addDays(from, offset);
  while (!openingHoursFor(date)) date = addDays(date, 1);
  return date;
}

export async function seedIfEmpty(dataSource: DataSource, options: SeedOptions): Promise<void> {
  if ((await dataSource.getRepository(Barber).count()) > 0) return;

  await dataSource.transaction(async (manager) => {
    const barbers = await manager.save(Barber, BARBERS.map((barber) => manager.create(Barber, barber)));
    const services = await manager.save(Service, SERVICES.map((service) => manager.create(Service, service)));

    await manager.save(
      manager.create(AdminUser, {
        email: options.adminEmail.toLowerCase(),
        name: "Administración Filo",
        passwordHash: options.passwordService.hash(options.adminPassword)
      })
    );

    if (options.withSampleBookings === false) return;

    const today = options.clock.now().date;
    const timestamp = options.clock.timestamp();

    const appointments = SAMPLE_BOOKINGS.map((booking, index) => {
      const customer = SAMPLE_CUSTOMERS[booking.customer]!;
      const service = services[booking.service]!;
      return manager.create(Appointment, {
        code: `DEMO0${index + 1}`,
        barberId: barbers[booking.barber]!.id,
        serviceId: service.id,
        customer: {
          name: customer.name,
          rut: `${customer.body}-${computeVerifierDigit(customer.body)}`,
          phone: customer.phone,
          email: null
        },
        date: nextOpenDay(today, booking.dayOffset),
        startTime: booking.start,
        endTime: booking.end,
        priceClp: service.priceClp,
        status: AppointmentStatus.CONFIRMED,
        privacyAcceptedAt: timestamp,
        createdAt: timestamp,
        cancelledAt: null
      });
    });

    await manager.save(Appointment, appointments);
  });
}
