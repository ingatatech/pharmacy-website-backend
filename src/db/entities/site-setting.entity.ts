import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("site_setting")
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

  @Column({ type: "text", nullable: true })
  companyHistory: string | null;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  coreValues: string[];

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

  // A single site-wide notice (holiday hours, a temporary closure, a stock
  // alert) shown as a dismissible banner on every public page. Deliberately
  // just one message rather than a list/history — the SRS asks for
  // visitors to "receive important pharmacy announcements," not a full
  // news feed (that's what /articles is for).
  @Column({ type: "varchar", length: 500, nullable: true })
  announcementMessage: string | null;

  @Column({ type: "boolean", default: false })
  announcementActive: boolean;

  @UpdateDateColumn({ type: "timestamp", precision: 6 })
  updatedAt: Date;
}