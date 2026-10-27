import type { Request, Response } from "express";
import {
  createBarberSchema,
  createServiceSchema,
  updateBarberSchema,
  updateServiceSchema
} from "../dto/catalog.dto.js";
import { idParamSchema } from "../dto/common.dto.js";
import { parse } from "../middleware/validate.js";
import type { CatalogService } from "../services/catalog.service.js";

export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  listServices = async (_req: Request, res: Response): Promise<void> => {
    res.json({ data: await this.catalogService.listServices() });
  };

  listBarbers = async (_req: Request, res: Response): Promise<void> => {
    res.json({ data: await this.catalogService.listBarbers() });
  };

  listAllServices = async (_req: Request, res: Response): Promise<void> => {
    res.json({ data: await this.catalogService.listServices(true) });
  };

  listAllBarbers = async (_req: Request, res: Response): Promise<void> => {
    res.json({ data: await this.catalogService.listBarbers(true) });
  };

  createService = async (req: Request, res: Response): Promise<void> => {
    const service = await this.catalogService.createService(parse(createServiceSchema, req.body));
    res.status(201).json({ data: service });
  };

  updateService = async (req: Request, res: Response): Promise<void> => {
    const { id } = parse(idParamSchema, req.params);
    res.json({ data: await this.catalogService.updateService(id, parse(updateServiceSchema, req.body)) });
  };

  createBarber = async (req: Request, res: Response): Promise<void> => {
    const barber = await this.catalogService.createBarber(parse(createBarberSchema, req.body));
    res.status(201).json({ data: barber });
  };

  updateBarber = async (req: Request, res: Response): Promise<void> => {
    const { id } = parse(idParamSchema, req.params);
    res.json({ data: await this.catalogService.updateBarber(id, parse(updateBarberSchema, req.body)) });
  };
}
