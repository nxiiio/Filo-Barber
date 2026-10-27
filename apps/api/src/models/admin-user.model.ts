import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "admin_users" })
export class AdminUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 120, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 80 })
  name!: string;

  @Column({ type: "varchar", length: 100, select: false })
  passwordHash!: string;
}
