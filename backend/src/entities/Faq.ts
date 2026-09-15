import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Faq {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  question: string;

  @Column("text")
  answer: string;

  @Column({ type: "int", default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isPublished: boolean;
}
