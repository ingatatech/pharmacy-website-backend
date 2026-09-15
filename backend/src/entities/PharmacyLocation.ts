import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export interface WeeklyOpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

@Entity()
export class PharmacyLocation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  branchName: string;

  @Column()
  address: string;

  @Column({ type: "varchar", nullable: true })
  telephone: string | null;

  @Column({ type: "float", nullable: true })
  latitude: number | null;

  @Column({ type: "float", nullable: true })
  longitude: number | null;

  @Column({ type: "jsonb", nullable: true })
  openingHours: WeeklyOpeningHours | null;

  @Column("simple-array", { nullable: true })
  availableServices: string[] | null;

  @Column({ default: true })
  isActive: boolean;
}
