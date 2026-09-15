import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type CategoryType = "service" | "product";

@Entity()
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: "varchar" })
  type: CategoryType;
}
