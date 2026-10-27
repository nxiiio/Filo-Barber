import { z } from "zod";
import type { Appointment, AppointmentStatus } from "../models/appointment.model.js";
import { isoDate, positiveId, time } from "./common.dto.js";

const rut = z.string().trim().min(1, "Ingresa tu RUT").max(20);

export const availabilityQuerySchema = z.object({
  barberId: positiveId,
  serviceId: positiveId,
  date: isoDate
});

export const createBookingSchema = z.object({
  barberId: positiveId,
  serviceId: positiveId,
  date: isoDate,
  startTime: time,
  customer: z.object({
    name: z.string().trim().min(3, "Ingresa tu nombre completo").max(80),
    rut,
    phone: z.string().trim().min(1, "Ingresa tu teléfono").max(20),
    email: z.email("Correo inválido").max(120).optional().nullable().or(z.literal(""))
  }),
  privacyConsent: z.literal(true, { error: "Debes aceptar el uso de tus datos para reservar" })
});

export const bookingCodeParamSchema = z.object({ code: z.string().trim().min(4).max(12) });
export const rutSchema = z.object({ rut });

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type CreateBookingRequest = z.infer<typeof createBookingSchema>;

export interface SlotResponse {
  time: string;
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  closed: boolean;
  slots: SlotResponse[];
}

export interface BookingResponse {
  code: string;
  customerName: string;
  barberName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  priceClp: number;
  status: AppointmentStatus;
}

export interface AdminAppointmentResponse {
  id: number;
  code: string;
  barberId: number;
  serviceId: number;
  barberName: string;
  serviceName: string;
  customer: { name: string; rut: string; phone: string; email: string | null };
  date: string;
  startTime: string;
  endTime: string;
  priceClp: number;
  status: AppointmentStatus;
  createdAt: string;
  cancelledAt: string | null;
}

export function toBookingResponse(appointment: Appointment): BookingResponse {
  return {
    code: appointment.code,
    customerName: appointment.customer.name,
    barberName: appointment.barber.name,
    serviceName: appointment.service.name,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    priceClp: appointment.priceClp,
    status: appointment.status
  };
}

export function toAdminAppointmentResponse(appointment: Appointment): AdminAppointmentResponse {
  return {
    id: appointment.id,
    code: appointment.code,
    barberId: appointment.barberId,
    serviceId: appointment.serviceId,
    barberName: appointment.barber.name,
    serviceName: appointment.service.name,
    customer: { ...appointment.customer },
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    priceClp: appointment.priceClp,
    status: appointment.status,
    createdAt: appointment.createdAt,
    cancelledAt: appointment.cancelledAt
  };
}
