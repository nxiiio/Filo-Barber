import { z } from "zod";

export const isoDate = z.iso.date({ error: "La fecha debe tener formato AAAA-MM-DD" });
export const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener formato HH:mm");
export const positiveId = z.coerce.number().int().positive();

export const idParamSchema = z.object({ id: positiveId });

export const dateQuerySchema = z.object({ date: isoDate.optional() });
