import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "./category.entity";

@Entity("service")
export class Service {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", unique: true })
  slug: string;

  @Column({ type: "text" })
  shortDescription: string;

  @Column({ type: "text", nullable: true })
  detailedDescription: string | null;

  @Column({ type: "varchar", nullable: true })
  imageUrl: string | null;

  @Column({ type: "text", nullable: true })
  keyBenefit: string | null;

  @Column({ type: "text", nullable: true })
  intendedCustomers: string | null;

  @Column({ type: "text", nullable: true })
  requirements: string | null;

  @Column({ type: "text", nullable: true })
  process: string | null;

  @Column({ type: "text", nullable: true })
  limitations: string | null;

  @Column({ type: "boolean", default: true })
  isPublished: boolean;

  @Column({ type: "timestamp", precision: 6, default: () => "now()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 6 })
  updatedAt: Date;

  @Index("IDX_service_categoryId")
  @Column({ type: "uuid", nullable: true })
  categoryId: string | null;

  @Column({ type: "varchar", nullable: true })
  metaTitle: string | null;

  @Column({ type: "text", nullable: true })
  metaDescription: string | null;

  @ManyToOne(() => Category, (category) => category.services, {
    onDelete: "NO ACTION",
  })
  @JoinColumn({
    name: "categoryId",
    foreignKeyConstraintName: "FK_cb169715cbb8c74f263ba192ca8",
  })
  category: Category | null;
}