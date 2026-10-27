import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Barber } from "./barber.model.js";
import { Customer } from "./customer.model.js";
import { Service } from "./service.model.js";

export enum AppointmentStatus {
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled"
}

@Entity({ name: "appointments" })
@Index(["barberId", "date", "status"])
@Index(["customer.rut", "status"])
@Index(["date"])
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 12, unique: true })
  code!: string;

  @Column({ type: "integer", name: "barber_id" })
  barberId!: number;

  @ManyToOne(() => Barber, { nullable: false })
  @JoinColumn({ name: "barber_id" })
  barber!: Barber;

  @Column({ type: "integer", name: "service_id" })
  serviceId!: number;

  @ManyToOne(() => Service, { nullable: false })
  @JoinColumn({ name: "service_id" })
  service!: Service;

  @Column(() => Customer)
  customer!: Customer;

  @Column({ type: "varchar", length: 10 })
  date!: string;

  @Column({ type: "varchar", length: 5 })
  startTime!: string;

  @Column({ type: "varchar", length: 5 })
  endTime!: string;

  @Column({ type: "integer" })
  priceClp!: number;

  @Column({ type: "simple-enum", enum: AppointmentStatus, default: AppointmentStatus.CONFIRMED })
  status!: AppointmentStatus;

  @Column({ type: "varchar", length: 30 })
  privacyAcceptedAt!: string;

  @Column({ type: "varchar", length: 30 })
  createdAt!: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  cancelledAt!: string | null;
}
