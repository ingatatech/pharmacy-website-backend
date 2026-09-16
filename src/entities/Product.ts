import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "./Category";

export type ProductAvailabilityStatus = "in_stock" | "out_of_stock" | "unknown";

@Entity()
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: "varchar", nullable: true })
  brandName: string | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn()
  category: Category | null;

  @Column({ type: "text", nullable: true })
  generalDescription: string | null;

  @Column({ type: "text", nullable: true })
  generalUse: string | null;

  @Column({ type: "text", nullable: true })
  precautions: string | null;

  @Column({ type: "text", nullable: true })
  storageInformation: string | null;

  @Column({ type: "varchar", nullable: true })
  activeIngredient: string | null;

  @Column({ type: "varchar", nullable: true })
  formStrength: string | null;

  @Column({ type: "varchar", nullable: true })
  manufacturer: string | null;

  @Column({ type: "text", nullable: true })
  dosageInformation: string | null;

  @Column({ default: false })
  requiresPrescription: boolean;

  @Column({ type: "varchar", default: "unknown" })
  availabilityStatus: ProductAvailabilityStatus;

  @Column({ type: "varchar", nullable: true })
  imageUrl: string | null;

  @Column({ type: "varchar", nullable: true })
  metaTitle: string | null;

  @Column({ type: "text", nullable: true })
  metaDescription: string | null;

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
