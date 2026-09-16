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

@Entity()
export class Service {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column("text")
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

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn()
  category: Category | null;

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
