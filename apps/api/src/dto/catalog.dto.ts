import { z } from "zod";

const atLeastOneField = { error: "Debes enviar al menos un campo" };

const serviceFields = {
  name: z.string().trim().min(3).max(60),
  description: z.string().trim().min(5).max(200),
  durationMinutes: z.number().int().min(15).max(240),
  priceClp: z.number().int().min(0).max(1_000_000),
  active: z.boolean()
};

export const createServiceSchema = z.object({ ...serviceFields, active: serviceFields.active.default(true) });
export const updateServiceSchema = z
  .object(serviceFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, atLeastOneField);

const barberFields = {
  name: z.string().trim().min(3).max(60),
  specialty: z.string().trim().min(3).max(80),
  active: z.boolean()
};

export const createBarberSchema = z.object({ ...barberFields, active: barberFields.active.default(true) });
export const updateBarberSchema = z
  .object(barberFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, atLeastOneField);

export type CreateServiceRequest = z.infer<typeof createServiceSchema>;
export type UpdateServiceRequest = z.infer<typeof updateServiceSchema>;
export type CreateBarberRequest = z.infer<typeof createBarberSchema>;
export type UpdateBarberRequest = z.infer<typeof updateBarberSchema>;
