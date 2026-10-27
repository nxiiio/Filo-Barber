import type { Request, Response } from "express";
import { dateQuerySchema, idParamSchema } from "../dto/common.dto.js";
import { parse } from "../middleware/validate.js";
import type { AgendaService } from "../services/agenda.service.js";

export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  getDailyAgenda = async (req: Request, res: Response): Promise<void> => {
    const date = parse(dateQuerySchema, req.query).date ?? this.agendaService.today();
    res.json({ data: await this.agendaService.getDailyAgenda(date) });
  };

  cancelAppointment = async (req: Request, res: Response): Promise<void> => {
    const { id } = parse(idParamSchema, req.params);
    res.json({ data: await this.agendaService.cancel(id) });
  };
}
