import type {
  AdminAppointment,
  AdminSession,
  Agenda,
  Availability,
  Barber,
  Booking,
  CustomerData,
  Service
} from "../types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: { field: string; message: string }[] = []
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "UNKNOWN",
      error?.message ?? "Ocurrió un error inesperado",
      error?.details
    );
  }
  return payload.data as T;
}

export interface NewBooking {
  serviceId: number;
  barberId: number;
  date: string;
  startTime: string;
  customer: CustomerData;
  privacyConsent: true;
}

export const api = {
  services: () => request<Service[]>("/services"),
  barbers: () => request<Barber[]>("/barbers"),
  availability: (barberId: number, serviceId: number, date: string) =>
    request<Availability>(`/availability?${new URLSearchParams({ barberId: String(barberId), serviceId: String(serviceId), date })}`),
  createBooking: (booking: NewBooking) => request<Booking>("/appointments", { method: "POST", body: booking }),
  findBooking: (code: string, rut: string) =>
    request<Booking>(`/appointments/${encodeURIComponent(code)}?${new URLSearchParams({ rut })}`),
  cancelBooking: (code: string, rut: string) =>
    request<Booking>(`/appointments/${encodeURIComponent(code)}/cancel`, { method: "POST", body: { rut } }),

  login: (email: string, password: string) =>
    request<AdminSession>("/auth/login", { method: "POST", body: { email, password } }),
  agenda: (token: string, date: string) => request<Agenda>(`/admin/agenda?date=${date}`, { token }),
  adminCancel: (token: string, id: number) =>
    request<AdminAppointment>(`/admin/appointments/${id}/cancel`, { method: "POST", token }),
  adminServices: (token: string) => request<Service[]>("/admin/services", { token }),
  createService: (token: string, body: Omit<Service, "id">) =>
    request<Service>("/admin/services", { method: "POST", body, token }),
  updateService: (token: string, id: number, body: Partial<Omit<Service, "id">>) =>
    request<Service>(`/admin/services/${id}`, { method: "PATCH", body, token }),
  adminBarbers: (token: string) => request<Barber[]>("/admin/barbers", { token }),
  createBarber: (token: string, body: Omit<Barber, "id">) =>
    request<Barber>("/admin/barbers", { method: "POST", body, token }),
  updateBarber: (token: string, id: number, body: Partial<Omit<Barber, "id">>) =>
    request<Barber>(`/admin/barbers/${id}`, { method: "PATCH", body, token })
};
