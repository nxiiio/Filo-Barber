import { Check, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "services" })
@Check(`"duration_minutes" > 0`)
@Check(`"price_clp" >= 0`)
export class Service {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 60 })
  name!: string;

  @Column({ type: "varchar", length: 200 })
  description!: string;

  @Column({ type: "integer" })
  durationMinutes!: number;

  @Column({ type: "integer" })
  priceClp!: number;

  @Column({ type: "boolean", default: true })
  active!: boolean;
}
