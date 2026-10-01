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

@Entity("contact_inquiry")
export class ContactInquiry {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  fullName: string;

  @Column({ type: "varchar" })
  phoneNumber: string;

  @Column({ type: "varchar" })
  email: string;

  @Column({ type: "varchar", nullable: true })
  subject: string | null;

  @Column({ type: "varchar", nullable: true })
  inquiryType: string | null;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "varchar", nullable: true })
  preferredContactMethod: string | null;

  @Column({ type: "varchar", nullable: true })
  preferredBranch: string | null;

  @Column({ type: "varchar", default: "new" })
  status: string;

  @Column({ type: "timestamp", precision: 6, default: () => "now()" })
  createdAt: Date;

  // Submitting the form has never required an account, so this stays
  // optional — it's only set when the caller happened to be logged in.
  // SetNull (not the Restrict/NoAction used for staff-authored records
  // elsewhere) because deleting a customer account should never be blocked
  // by, or destroy, an inquiry they once submitted — it just becomes
  // unowned, the way it would have been if they'd never logged in at all.
  @Index("IDX_contact_inquiry_userId")
  @Column({ type: "uuid", nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.contactInquiries, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "userId", foreignKeyConstraintName: "contact_inquiry_userId_fkey" })
  user: User | null;

  // Which branch the enquiry was directed at, as a real relation rather than
  // only the free-text preferredBranch column. The public form has always had
  // the option to pick a branch, and the public GET /api/locations list is
  // available to the browser unauthenticated, so the form now sends the
  // chosen location's id alongside its name. SetNull for the same reason as
  // `user` above: retiring a branch must not destroy enquiries it received.
  // Rows written before this column existed keep preferredBranch only and are
  // visible to admins, but won't match a pharmacist's branch filter.
  @Index("IDX_contact_inquiry_locationId")
  @Column({ type: "uuid", nullable: true })
  locationId: string | null;

  @ManyToOne(() => PharmacyLocation, (location) => location.contactInquiries, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "locationId", foreignKeyConstraintName: "contact_inquiry_locationId_fkey" })
  location: PharmacyLocation | null;
}