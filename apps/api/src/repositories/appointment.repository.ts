import { MoreThan, MoreThanOrEqual, type DataSource, type Repository } from "typeorm";
import { Appointment, AppointmentStatus } from "../models/appointment.model.js";
import type { LocalDateTime } from "../shared/clock.js";
import { toTime } from "../utils/schedule.js";

const WITH_DETAILS = { barber: true, service: true } as const;

export class AppointmentRepository {
  private readonly repository: Repository<Appointment>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Appointment);
  }

  findConfirmedByBarberAndDate(barberId: number, date: string): Promise<Appointment[]> {
    return this.repository.find({
      where: { barberId, date, status: AppointmentStatus.CONFIRMED },
      order: { startTime: "ASC" }
    });
  }

  countUpcomingByRut(rut: string, from: LocalDateTime): Promise<number> {
    const confirmedForCustomer = { customer: { rut }, status: AppointmentStatus.CONFIRMED };
    return this.repository.count({
      where: [
        { ...confirmedForCustomer, date: MoreThan(from.date) },
        { ...confirmedForCustomer, date: from.date, startTime: MoreThanOrEqual(toTime(from.minutes)) }
      ]
    });
  }

  findByCode(code: string): Promise<Appointment | null> {
    return this.repository.findOne({ where: { code }, relations: WITH_DETAILS });
  }

  findById(id: number): Promise<Appointment | null> {
    return this.repository.findOne({ where: { id }, relations: WITH_DETAILS });
  }

  findByDate(date: string): Promise<Appointment[]> {
    return this.repository.find({
      where: { date },
      relations: WITH_DETAILS,
      order: { startTime: "ASC", barber: { name: "ASC" } }
    });
  }

  existsByCode(code: string): Promise<boolean> {
    return this.repository.existsBy({ code });
  }

  async save(appointment: Partial<Appointment>): Promise<Appointment> {
    const saved = await this.repository.save(this.repository.create(appointment));
    return (await this.findById(saved.id)) as Appointment;
  }

  async markCancelled(id: number, cancelledAt: string): Promise<void> {
    await this.repository.update({ id }, { status: AppointmentStatus.CANCELLED, cancelledAt });
  }
}
