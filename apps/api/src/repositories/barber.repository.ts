import type { DataSource, Repository } from "typeorm";
import { Barber } from "../models/barber.model.js";

export class BarberRepository {
  private readonly repository: Repository<Barber>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Barber);
  }

  findAll(includeInactive = false): Promise<Barber[]> {
    return this.repository.find({
      where: includeInactive ? {} : { active: true },
      order: { name: "ASC" }
    });
  }

  findById(id: number): Promise<Barber | null> {
    return this.repository.findOneBy({ id });
  }

  save(barber: Partial<Barber>): Promise<Barber> {
    return this.repository.save(this.repository.create(barber));
  }
}
