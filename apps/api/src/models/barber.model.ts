import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "barbers" })
export class Barber {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 60 })
  name!: string;

  @Column({ type: "varchar", length: 80 })
  specialty!: string;

  @Column({ type: "boolean", default: true })
  active!: boolean;
}
