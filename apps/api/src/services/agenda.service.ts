import { toAdminAppointmentResponse, type AdminAppointmentResponse } from "../dto/booking.dto.js";
import { BusinessException, NotFoundException } from "../exceptions/app-error.js";
import { AppointmentStatus } from "../models/appointment.model.js";
import type { AppointmentRepository } from "../repositories/appointment.repository.js";
import type { Clock } from "../shared/clock.js";

export interface DailySummary {
  date: string;
  confirmed: number;
  cancelled: number;
  expectedRevenueClp: number;
}

export interface DailyAgenda {
  summary: DailySummary;
  appointments: AdminAppointmentResponse[];
}

export class AgendaService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly clock: Clock
  ) {}

  today(): string {
    return this.clock.now().date;
  }

  async getDailyAgenda(date: string): Promise<DailyAgenda> {
    const appointments = await this.appointmentRepository.findByDate(date);
    const confirmed = appointments.filter((appointment) => appointment.status === AppointmentStatus.CONFIRMED);

    return {
      summary: {
        date,
        confirmed: confirmed.length,
        cancelled: appointments.length - confirmed.length,
        expectedRevenueClp: confirmed.reduce((total, appointment) => total + appointment.priceClp, 0)
      },
      appointments: appointments.map(toAdminAppointmentResponse)
    };
  }

  async cancel(id: number): Promise<AdminAppointmentResponse> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) throw new NotFoundException("Reserva");
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BusinessException("ALREADY_CANCELLED", "La reserva ya estaba cancelada");
    }

    const cancelledAt = this.clock.timestamp();
    await this.appointmentRepository.markCancelled(id, cancelledAt);
    return toAdminAppointmentResponse({ ...appointment, status: AppointmentStatus.CANCELLED, cancelledAt });
  }
}
