import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().max(120),
  password: z.string().min(1).max(128)
});

export type LoginRequest = z.infer<typeof loginSchema>;

export interface LoginResponse {
  token: string;
  admin: { id: number; email: string; name: string };
}
