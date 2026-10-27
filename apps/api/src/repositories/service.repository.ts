import type { DataSource, Repository } from "typeorm";
import { Service } from "../models/service.model.js";

export class ServiceRepository {
  private readonly repository: Repository<Service>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Service);
  }

  findAll(includeInactive = false): Promise<Service[]> {
    return this.repository.find({
      where: includeInactive ? {} : { active: true },
      order: { priceClp: "ASC" }
    });
  }

  findById(id: number): Promise<Service | null> {
    return this.repository.findOneBy({ id });
  }

  save(service: Partial<Service>): Promise<Service> {
    return this.repository.save(this.repository.create(service));
  }
}
