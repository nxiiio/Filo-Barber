import { Column } from "typeorm";

export class Customer {
  @Column({ type: "varchar", length: 80 })
  name!: string;

  @Column({ type: "varchar", length: 12 })
  rut!: string;

  @Column({ type: "varchar", length: 16 })
  phone!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  email!: string | null;
}
