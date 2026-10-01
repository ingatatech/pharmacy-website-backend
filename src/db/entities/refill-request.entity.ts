import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PharmacyLocation } from "./pharmacy-location.entity";
import { User } from "./user.entity";

@Entity("refill_request")
export class RefillRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  fullName: string;

  @Column({ type: "varchar" })
  phoneNumber: string;

  @Column({ type: "varchar", nullable: true })
  email: string | null;

  @Column({ type: "varchar", nullable: true })
  preferredBranch: string | null;

  @Column({ type: "varchar", nullable: true })
  prescriptionReference: string | null;

  @Column({ type: "varchar", nullable: true })
  medicationName: string | null;

  @Column({ type: "text", nullable: true })
  additionalNotes: string | null;

  @Column({ type: "varchar", nullable: true })
  preferredPickupMethod: string | null;

  @Column({ type: "varchar", default: "submitted" })
  status: string;

  @Column({ type: "timestamp", precision: 6, default: () => "now()" })
  createdAt: Date;

  @Index("IDX_refill_request_userId")
  @Column({ type: "uuid", nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.refillRequests, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "userId", foreignKeyConstraintName: "refill_request_userId_fkey" })
  user: User | null;

  // Which branch the refill was requested from, as a real relation rather than
  // only the free-text preferredBranch — a pharmacist's area filters on this,
  // which a misspelled branch name could not satisfy reliably.
  // The public GET /api/locations list is unauthenticated, so the form sends
  // the chosen location's id alongside its name. SetNull, not Restrict:
  // retiring a branch must not delete the requests customers already placed.
  @Index("IDX_refill_request_locationId")
  @Column({ type: "uuid", nullable: true })
  locationId: string | null;

  @ManyToOne(() => PharmacyLocation, (location) => location.refillRequests, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "locationId", foreignKeyConstraintName: "refill_request_locationId_fkey" })
  location: PharmacyLocation | null;
}