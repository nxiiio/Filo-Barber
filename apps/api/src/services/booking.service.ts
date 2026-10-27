import {
  toBookingResponse,
  type AvailabilityQuery,
  type AvailabilityResponse,
  type BookingResponse
} from "../dto/booking.dto.js";
import { BusinessException, NotFoundException } from "../exceptions/app-error.js";
import { AppointmentStatus, type Appointment } from "../models/appointment.model.js";
import type { AppointmentRepository } from "../repositories/appointment.repository.js";
import { assertCanBook, isBeyondBookingWindow, isInPast } from "../rules/booking.rules.js";
import type { CodeGenerator } from "../security/booking-code.generator.js";
import type { Clock } from "../shared/clock.js";
import type { Mutex } from "../utils/mutex.js";
import { normalizeRut } from "../utils/rut.js";
import { candidateStarts, rangesOverlap, toMinutes, toTime, type TimeRange } from "../utils/schedule.js";
import type { CatalogService } from "./catalog.service.js";

export interface CreateBookingCommand {
  barberId: number;
  serviceId: number;
  date: string;
  startTime: string;
  customer: {
    name: string;
    rut: string;
    phone: string;
    email?: string | null;
  };
}

export class BookingService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly catalogService: CatalogService,
    private readonly clock: Clock,
    private readonly codeGenerator: CodeGenerator,
    private readonly bookingLock: Mutex
  ) {}

  async getAvailability(query: AvailabilityQuery): Promise<AvailabilityResponse> {
    const service = await this.catalogService.requireActiveService(query.serviceId);
    await this.catalogService.requireActiveBarber(query.barberId);

    const starts = candidateStarts(query.date, service.durationMinutes);
    if (starts.length === 0) return { date: query.date, closed: true, slots: [] };

    const now = this.clock.now();
    const outOfWindow = isBeyondBookingWindow(now, query.date);
    const agenda = await this.barberAgenda(query.barberId, query.date);

    const slots = starts.map((start) => {
      const range = { start, end: start + service.durationMinutes };
      const available =
        !outOfWindow &&
        !isInPast(now, query.date, start) &&
        !agenda.some((taken) => rangesOverlap(taken, range));
      return { time: toTime(start), available };
    });

    return { date: query.date, closed: false, slots };
  }

  async createBooking(command: CreateBookingCommand): Promise<BookingResponse> {
    const service = await this.catalogService.requireActiveService(command.serviceId);
    await this.catalogService.requireActiveBarber(command.barberId);

    const rut = normalizeRut(command.customer.rut);
    const start = toMinutes(command.startTime);
    const range = { start, end: start + service.durationMinutes };

    const created = await this.bookingLock.runExclusive(async () => {
      const now = this.clock.now();

      assertCanBook({
        date: command.date,
        range,
        now,
        barberAgenda: await this.barberAgenda(command.barberId, command.date)
      });

      const timestamp = this.clock.timestamp();
      return this.appointmentRepository.save({
        code: await this.uniqueCode(),
        barberId: command.barberId,
        serviceId: service.id,
        customer: {
          name: command.customer.name.trim(),
          rut,
          phone: command.customer.phone.trim(),
          email: command.customer.email?.trim().toLowerCase() || null
        },
        date: command.date,
        startTime: toTime(range.start),
        endTime: toTime(range.end),
        priceClp: service.priceClp,
        status: AppointmentStatus.CONFIRMED,
        privacyAcceptedAt: timestamp,
        createdAt: timestamp,
        cancelledAt: null
      });
    });

    return toBookingResponse(created);
  }

  async findBooking(code: string, rut: string): Promise<BookingResponse> {
    return toBookingResponse(await this.requireOwnedBooking(code, rut));
  }

  async cancelBooking(code: string, rut: string): Promise<BookingResponse> {
    const appointment = await this.requireOwnedBooking(code, rut);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BusinessException("ALREADY_CANCELLED", "La reserva ya estaba cancelada");
    }

    await this.appointmentRepository.markCancelled(appointment.id, this.clock.timestamp());

    return { ...toBookingResponse(appointment), status: AppointmentStatus.CANCELLED };
  }

  private async requireOwnedBooking(code: string, rut: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findByCode(code.trim().toUpperCase());
    const ownsBooking = appointment && appointment.customer.rut === normalizeRut(rut);
    if (!appointment || !ownsBooking) throw new NotFoundException("Reserva");
    return appointment;
  }

  private async barberAgenda(barberId: number, date: string): Promise<TimeRange[]> {
    const appointments = await this.appointmentRepository.findConfirmedByBarberAndDate(barberId, date);
    return appointments.map((appointment) => ({
      start: toMinutes(appointment.startTime),
      end: toMinutes(appointment.endTime)
    }));
  }

  private async uniqueCode(): Promise<string> {
    let code = this.codeGenerator.generate();
    while (await this.appointmentRepository.existsByCode(code)) code = this.codeGenerator.generate();
    return code;
  }
}
