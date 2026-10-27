import type { z } from "zod";
import { ValidationException } from "../exceptions/app-error.js";

export function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationException(
      "Los datos enviados no son válidos",
      result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }))
    );
  }
  return result.data;
}
