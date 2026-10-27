import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { Controllers } from "../config/app-context.js";
import { notFoundHandler } from "../middleware/error-handler.js";
import { requireAdmin } from "../middleware/require-admin.js";
import type { AuthService } from "../services/auth.service.js";

function loginRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: { code: "TOO_MANY_REQUESTS", message: "Demasiados intentos. Intenta nuevamente en unos minutos." } }
  });
}

export function createApiRouter(controllers: Controllers, authService: AuthService): Router {
  const { booking, catalog, agenda, auth } = controllers;
  const api = Router();

  api.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  api.get("/services", catalog.listServices);
  api.get("/barbers", catalog.listBarbers);
  api.get("/availability", booking.getAvailability);
  api.post("/appointments", booking.create);
  api.get("/appointments/:code", booking.findByCode);
  api.post("/appointments/:code/cancel", booking.cancel);

  api.post("/auth/login", loginRateLimiter(), auth.login);

  const admin = Router();
  admin.use(requireAdmin(authService));
  admin.get("/me", auth.me);
  admin.get("/agenda", agenda.getDailyAgenda);
  admin.post("/appointments/:id/cancel", agenda.cancelAppointment);
  admin.get("/services", catalog.listAllServices);
  admin.post("/services", catalog.createService);
  admin.patch("/services/:id", catalog.updateService);
  admin.get("/barbers", catalog.listAllBarbers);
  admin.post("/barbers", catalog.createBarber);
  admin.patch("/barbers/:id", catalog.updateBarber);
  api.use("/admin", admin);

  api.use(notFoundHandler);
  return api;
}
