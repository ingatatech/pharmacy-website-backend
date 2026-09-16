import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from "typeorm";

@Entity()
export class SiteSetting {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", nullable: true })
  pharmacyName: string | null;

  @Column({ type: "text", nullable: true })
  aboutUs: string | null;

  @Column({ type: "text", nullable: true })
  mission: string | null;

  @Column({ type: "text", nullable: true })
  vision: string | null;

  @Column("simple-array", { nullable: true })
  coreValues: string[] | null;

  @Column({ type: "text", nullable: true })
  whyChooseUs: string | null;

  @Column({ type: "varchar", nullable: true })
  heroHeadline: string | null;

  @Column({ type: "text", nullable: true })
  heroSubheading: string | null;

  @Column({ type: "varchar", nullable: true })
  phone: string | null;

  @Column({ type: "varchar", nullable: true })
  email: string | null;

  @Column({ type: "varchar", nullable: true })
  address: string | null;

  @Column({ type: "varchar", nullable: true })
  facebookUrl: string | null;

  @Column({ type: "varchar", nullable: true })
  instagramUrl: string | null;

  @Column({ type: "varchar", nullable: true })
  linkedinUrl: string | null;

  @Column({ type: "varchar", nullable: true })
  xUrl: string | null;

  @Column({ type: "varchar", nullable: true })
  whatsappUrl: string | null;

  @Column({ type: "varchar", nullable: true })
  youtubeUrl: string | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
