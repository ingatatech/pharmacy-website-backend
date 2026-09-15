import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type RefillRequestStatus = "submitted" | "under_review" | "approved" | "rejected" | "completed";

@Entity()
export class RefillRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  fullName: string;

  @Column()
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
  status: RefillRequestStatus;

  @CreateDateColumn()
  createdAt: Date;
}
