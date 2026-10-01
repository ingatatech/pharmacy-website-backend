import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("testimonial")
export class Testimonial {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  customerName: string;

  @Column({ type: "varchar", nullable: true })
  customerCategory: string | null;

  @Column({ type: "text" })
  testimonialText: string;

  @Column({ type: "varchar", nullable: true })
  photoUrl: string | null;

  @Column({ type: "integer", default: 0 })
  displayOrder: number;

  @Column({ type: "boolean", default: false })
  isPublished: boolean;

  @Column({ type: "timestamp", precision: 6, default: () => "now()" })
  createdAt: Date;
}