import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PharmacyLocation } from "./pharmacy-location.entity";
import { TeamMember } from "./team-member.entity";

/**
 * One recurring weekly shift for a published staff member at a branch.
 *
 * Deliberately not a dated calendar: a small pharmacy's roster repeats week to
 * week, and a single row per weekday keeps the admin form simple. `dayOfWeek`
 * follows JavaScript's Date#getDay() (0 = Sunday … 6 = Saturday) so the public
 * board can highlight today without a second mapping table.
 *
 * Times are stored as "HH:MM" strings rather than a Postgres `time` so they
 * arrive in the client exactly as entered (no driver-side Date coercion).
 */
@Entity("pharmacist_shift")
@Index("UQ_pharmacist_shift_slot", ["locationId", "teamMemberId", "dayOfWeek", "startTime"], {
  unique: true,
})
export class PharmacistShift {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("IDX_pharmacist_shift_teamMemberId")
  @Column({ type: "uuid" })
  teamMemberId: string;

  @ManyToOne(() => TeamMember, (member) => member.shifts, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "teamMemberId", foreignKeyConstraintName: "FK_pharmacist_shift_teamMember" })
  teamMember: TeamMember;

  @Index("IDX_pharmacist_shift_locationId")
  @Column({ type: "uuid" })
  locationId: string;

  @ManyToOne(() => PharmacyLocation, (location) => location.pharmacistShifts, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "locationId", foreignKeyConstraintName: "FK_pharmacist_shift_location" })
  location: PharmacyLocation;

  @Column({ type: "smallint" })
  dayOfWeek: number;

  @Column({ type: "varchar", length: 5 })
  startTime: string;

  @Column({ type: "varchar", length: 5 })
  endTime: string;

  // e.g. "Morning shift" or "Vaccination desk".
  @Column({ type: "varchar", length: 120, nullable: true })
  note: string | null;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "timestamp", precision: 6, default: () => "now()" })
  createdAt: Date;
}
