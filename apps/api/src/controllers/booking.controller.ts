import type { Request, Response } from "express";
import {
  availabilityQuerySchema,
  bookingCodeParamSchema,
  createBookingSchema,
  rutSchema
} from "../dto/booking.dto.js";
import { parse } from "../middleware/validate.js";
import type { BookingService } from "../services/booking.service.js";

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  getAvailability = async (req: Request, res: Response): Promise<void> => {
    const query = parse(availabilityQuerySchema, req.query);
    res.json({ data: await this.bookingService.getAvailability(query) });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { barberId, serviceId, date, startTime, customer } = parse(createBookingSchema, req.body);
    const booking = await this.bookingService.createBooking({
      barberId,
      serviceId,
      date,
      startTime,
      customer: { ...customer, email: customer.email || null }
    });
    res.status(201).json({ data: booking });
  };

  findByCode = async (req: Request, res: Response): Promise<void> => {
    const { code } = parse(bookingCodeParamSchema, req.params);
    const { rut } = parse(rutSchema, req.query);
    res.json({ data: await this.bookingService.findBooking(code, rut) });
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const { code } = parse(bookingCodeParamSchema, req.params);
    const { rut } = parse(rutSchema, req.body);
    res.json({ data: await this.bookingService.cancelBooking(code, rut) });
  };
}
