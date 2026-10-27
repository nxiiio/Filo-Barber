import type {
  CreateBarberRequest,
  CreateServiceRequest,
  UpdateBarberRequest,
  UpdateServiceRequest
} from "../dto/catalog.dto.js";
import { BusinessException, NotFoundException } from "../exceptions/app-error.js";
import type { Barber } from "../models/barber.model.js";
import type { Service } from "../models/service.model.js";
import type { BarberRepository } from "../repositories/barber.repository.js";
import type { ServiceRepository } from "../repositories/service.repository.js";

export class CatalogService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly barberRepository: BarberRepository
  ) {}

  listServices(includeInactive = false): Promise<Service[]> {
    return this.serviceRepository.findAll(includeInactive);
  }

  listBarbers(includeInactive = false): Promise<Barber[]> {
    return this.barberRepository.findAll(includeInactive);
  }

  createService(request: CreateServiceRequest): Promise<Service> {
    return this.serviceRepository.save(request);
  }

  async updateService(id: number, request: UpdateServiceRequest): Promise<Service> {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new NotFoundException("Servicio");
    return this.serviceRepository.save({ ...service, ...request });
  }

  createBarber(request: CreateBarberRequest): Promise<Barber> {
    return this.barberRepository.save(request);
  }

  async updateBarber(id: number, request: UpdateBarberRequest): Promise<Barber> {
    const barber = await this.barberRepository.findById(id);
    if (!barber) throw new NotFoundException("Barbero");
    return this.barberRepository.save({ ...barber, ...request });
  }

  async requireActiveService(id: number): Promise<Service> {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new NotFoundException("Servicio");
    if (!service.active) throw new BusinessException("INACTIVE_RESOURCE", "El servicio no está disponible");
    return service;
  }

  async requireActiveBarber(id: number): Promise<Barber> {
    const barber = await this.barberRepository.findById(id);
    if (!barber) throw new NotFoundException("Barbero");
    if (!barber.active) throw new BusinessException("INACTIVE_RESOURCE", "El barbero no está disponible");
    return barber;
  }
}
