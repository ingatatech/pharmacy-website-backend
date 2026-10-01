import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PharmacyLocation } from "./pharmacy-location.entity";

@Entity("team_member")
export class TeamMember {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  fullName: string;

  @Column({ type: "varchar" })
  role: string;

  @Column({ type: "varchar", nullable: true })
  credentials: string | null;

  @Column({ type: "text", nullable: true })
  bio: string | null;

  @Column({ type: "varchar", nullable: true })
  photoUrl: string | null;

  @Column({ type: "integer", default: 0 })
  displayOrder: number;

  @Column({ type: "boolean", default: false })
  isPublished: boolean;

  @Column({ type: "timestamp", precision: 6, default: () => "now()" })
  createdAt: Date;

  // Nullable: a member tied to one branch shows only on that branch's page;
  // left unassigned, they're not shown anywhere yet — kept for a possible
  // future company-wide "Leadership" section without forcing that scope now.
  @Index("IDX_team_member_locationId")
  @Column({ type: "uuid", nullable: true })
  locationId: string | null;

  @ManyToOne(() => PharmacyLocation, (location) => location.team, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "locationId", foreignKeyConstraintName: "team_member_locationId_fkey" })
  location: PharmacyLocation | null;
}