import type { LocalDateTime } from "../shared/clock.js";
import { BusinessException } from "../exceptions/app-error.js";
import { daysBetween, isWithinOpeningHours, rangesOverlap, type TimeRange } from "../utils/schedule.js";

export const BOOKING_POLICY = {
  maxDaysAhead: 30,
  maxActiveBookingsPerCustomer: 2
} as const;

export function minutesUntil(now: LocalDateTime, date: string, startMinutes: number): number {
  return daysBetween(now.date, date) * 24 * 60 + (startMinutes - now.minutes);
}

export function isInPast(now: LocalDateTime, date: string, startMinutes: number): boolean {
  return minutesUntil(now, date, startMinutes) < 0;
}

export function isBeyondBookingWindow(now: LocalDateTime, date: string): boolean {
  return daysBetween(now.date, date) > BOOKING_POLICY.maxDaysAhead;
}

export interface BookingRequest {
  date: string;
  range: TimeRange;
  now: LocalDateTime;
  barberAgenda: TimeRange[];
  activeBookingsForCustomer: number;
}

export function assertCanBook(request: BookingRequest): void {
  const { date, range, now, barberAgenda, activeBookingsForCustomer } = request;

  if (isInPast(now, date, range.start)) {
    throw new BusinessException("BOOKING_IN_PAST", "No se puede reservar un horario que ya pasó");
  }

  if (isBeyondBookingWindow(now, date)) {
    throw new BusinessException(
      "BOOKING_TOO_FAR",
      `Solo se puede reservar hasta ${BOOKING_POLICY.maxDaysAhead} días hacia adelante`
    );
  }

  if (!isWithinOpeningHours(date, range)) {
    throw new BusinessException("OUTSIDE_BUSINESS_HOURS", "El horario elegido está fuera del horario de atención");
  }

  if (barberAgenda.some((taken) => rangesOverlap(taken, range))) {
    throw new BusinessException("SLOT_UNAVAILABLE", "El barbero ya tiene una reserva en ese horario");
  }

  if (activeBookingsForCustomer >= BOOKING_POLICY.maxActiveBookingsPerCustomer) {
    throw new BusinessException(
      "BOOKING_LIMIT_REACHED",
      `Cada cliente puede tener como máximo ${BOOKING_POLICY.maxActiveBookingsPerCustomer} reservas activas`
    );
  }
}
