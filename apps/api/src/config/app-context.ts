import type { SignOptions } from "jsonwebtoken";
import type { DataSource } from "typeorm";
import { AgendaController } from "../controllers/agenda.controller.js";
import { AuthController } from "../controllers/auth.controller.js";
import { BookingController } from "../controllers/booking.controller.js";
import { CatalogController } from "../controllers/catalog.controller.js";
import { AdminUserRepository } from "../repositories/admin-user.repository.js";
import { AppointmentRepository } from "../repositories/appointment.repository.js";
import { BarberRepository } from "../repositories/barber.repository.js";
import { ServiceRepository } from "../repositories/service.repository.js";
import { BookingCodeGenerator, type CodeGenerator } from "../security/booking-code.generator.js";
import { PasswordService } from "../security/password.service.js";
import { TokenService } from "../security/token.service.js";
import { AgendaService } from "../services/agenda.service.js";
import { AuthService } from "../services/auth.service.js";
import { BookingService } from "../services/booking.service.js";
import { CatalogService } from "../services/catalog.service.js";
import type { Clock } from "../shared/clock.js";
import { Mutex } from "../utils/mutex.js";

export interface AppContextConfig {
  dataSource: DataSource;
  clock: Clock;
  jwtSecret: string;
  jwtExpiresIn: SignOptions["expiresIn"];
  codeGenerator?: CodeGenerator;
}

export interface Services {
  catalog: CatalogService;
  booking: BookingService;
  agenda: AgendaService;
  auth: AuthService;
}

export interface Controllers {
  catalog: CatalogController;
  booking: BookingController;
  agenda: AgendaController;
  auth: AuthController;
}

export interface AppContext {
  services: Services;
  controllers: Controllers;
}

export function createAppContext(config: AppContextConfig): AppContext {
  const serviceRepository = new ServiceRepository(config.dataSource);
  const barberRepository = new BarberRepository(config.dataSource);
  const appointmentRepository = new AppointmentRepository(config.dataSource);
  const adminUserRepository = new AdminUserRepository(config.dataSource);

  const catalog = new CatalogService(serviceRepository, barberRepository);
  const booking = new BookingService(
    appointmentRepository,
    catalog,
    config.clock,
    config.codeGenerator ?? new BookingCodeGenerator(),
    new Mutex()
  );
  const agenda = new AgendaService(appointmentRepository, config.clock);
  const auth = new AuthService(
    adminUserRepository,
    new PasswordService(),
    new TokenService(config.jwtSecret, config.jwtExpiresIn)
  );

  return {
    services: { catalog, booking, agenda, auth },
    controllers: {
      catalog: new CatalogController(catalog),
      booking: new BookingController(booking),
      agenda: new AgendaController(agenda),
      auth: new AuthController(auth)
    }
  };
}
