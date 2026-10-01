import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ContactInquiry } from "./contact-inquiry.entity";
import { RefillRequest } from "./refill-request.entity";
import { TeamMember } from "./team-member.entity";
import { User } from "./user.entity";

@Entity("pharmacy_location")
export class PharmacyLocation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("pharmacy_location_slug_key", { unique: true })
  @Column({ type: "varchar" })
  slug: string;

  @Column({ type: "varchar" })
  branchName: string;

  @Column({ type: "varchar" })
  address: string;

  @Column({ type: "varchar", nullable: true })
  telephone: string | null;

  @Column({ type: "double precision", nullable: true })
  latitude: number | null;

  @Column({ type: "double precision", nullable: true })
  longitude: number | null;

  @Column({ type: "jsonb", nullable: true })
  openingHours: unknown | null;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  availableServices: string[];

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  // A short blurb specific to this branch — distinct from the company-wide
  // SiteSetting.aboutUs text, e.g. "Our flagship branch, open since 2015...".
  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", nullable: true })
  photoUrl: string | null;

  @OneToMany(() => TeamMember, (member) => member.location)
  team: TeamMember[];

  // Branches that a pharmacist_reviewer account is responsible for.
  @OneToMany(() => User, (user) => user.location)
  pharmacists: User[];

  @OneToMany(() => RefillRequest, (request) => request.location)
  refillRequests: RefillRequest[];

  @OneToMany(() => ContactInquiry, (inquiry) => inquiry.location)
  contactInquiries: ContactInquiry[];
}