export interface Service {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  priceClp: number;
  active: boolean;
}

export interface Barber {
  id: number;
  name: string;
  specialty: string;
  active: boolean;
}

export interface Slot {
  time: string;
  available: boolean;
}

export interface Availability {
  date: string;
  closed: boolean;
  slots: Slot[];
}

export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  code: string;
  customerName: string;
  barberName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  priceClp: number;
  status: BookingStatus;
}

export interface CustomerData {
  name: string;
  rut: string;
  phone: string;
  email: string;
}

export interface AdminAppointment {
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
  status: BookingStatus;
}

export interface DailySummary {
  date: string;
  confirmed: number;
  cancelled: number;
  expectedRevenueClp: number;
}

export interface Agenda {
  summary: DailySummary;
  appointments: AdminAppointment[];
}

export interface AdminSession {
  token: string;
  admin: { id: number; email: string; name: string };
}
