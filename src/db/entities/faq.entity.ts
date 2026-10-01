import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("faq")
export class Faq {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  question: string;

  @Column({ type: "text" })
  answer: string;

  @Column({ type: "integer", default: 0 })
  displayOrder: number;

  @Column({ type: "boolean", default: true })
  isPublished: boolean;
}