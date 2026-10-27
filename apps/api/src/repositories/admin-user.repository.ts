import type { DataSource, Repository } from "typeorm";
import { AdminUser } from "../models/admin-user.model.js";

export class AdminUserRepository {
  private readonly repository: Repository<AdminUser>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(AdminUser);
  }

  findByEmailWithPassword(email: string): Promise<AdminUser | null> {
    return this.repository.findOne({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true }
    });
  }

  save(admin: Partial<AdminUser>): Promise<AdminUser> {
    return this.repository.save(this.repository.create(admin));
  }
}
