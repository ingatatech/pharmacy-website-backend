import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type ContactInquiryStatus = "new" | "in_progress" | "resolved";

@Entity()
export class ContactInquiry {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  fullName: string;

  @Column()
  phoneNumber: string;

  @Column()
  email: string;

  @Column({ type: "varchar", nullable: true })
  subject: string | null;

  @Column("text")
  message: string;

  @Column({ type: "varchar", nullable: true })
  preferredContactMethod: string | null;

  @Column({ type: "varchar", nullable: true })
  preferredBranch: string | null;

  @Column({ type: "varchar", default: "new" })
  status: ContactInquiryStatus;

  @CreateDateColumn()
  createdAt: Date;
}
