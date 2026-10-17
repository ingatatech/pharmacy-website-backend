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
import { PharmacyLocation } from "./pharmacy-location.entity";

@Entity("product")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", unique: true })
  slug: string;

  @Column({ type: "varchar", nullable: true })
  brandName: string | null;

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

  @Column({ type: "boolean", default: false })
  requiresPrescription: boolean;

  @Column({ type: "varchar", default: "unknown" })
  availabilityStatus: string;

  @Column({ type: "varchar", nullable: true })
  imageUrl: string | null;

  @Column({ type: "boolean", default: true })
  isPublished: boolean;

  @Column({ type: "timestamp", precision: 6, default: () => "now()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 6 })
  updatedAt: Date;

  @Index("IDX_product_categoryId")
  @Column({ type: "uuid", nullable: true })
  categoryId: string | null;

  @Index("IDX_product_locationId")
  @Column({ type: "uuid", nullable: true })
  locationId: string | null;

  @Column({ type: "varchar", nullable: true })
  metaTitle: string | null;

  @Column({ type: "text", nullable: true })
  metaDescription: string | null;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: "NO ACTION",
  })
  @JoinColumn({
    name: "categoryId",
    foreignKeyConstraintName: "FK_ff0c0301a95e517153df97f6812",
  })
  category: Category | null;

  @ManyToOne(() => PharmacyLocation, { onDelete: "NO ACTION" })
  @JoinColumn({
    name: "locationId",
    foreignKeyConstraintName: "FK_product_location",
  })
  location: PharmacyLocation | null;
}