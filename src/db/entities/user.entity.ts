import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Article } from "./article.entity";
import { AuditLog } from "./audit-log.entity";
import { ContactInquiry } from "./contact-inquiry.entity";
import { PharmacyLocation } from "./pharmacy-location.entity";
import { RefillRequest } from "./refill-request.entity";

@Entity("user")
// Mirrors the CHK_user_role constraint added in migration
// AddUserRoleCheckConstraint. It is declared here as well as in the migration
// so TypeORM's schema comparison sees the two as identical — otherwise
// `npm run db:verify` (and any future generated migration) would treat the
// constraint as drift and try to drop it, even though the live database has it.
@Check("CHK_user_role", `"role" IN ('admin', 'pharmacist_reviewer', 'customer')`)
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  email: string;

  /**
   * `select: false` reproduces Prisma's global `omit: { passwordHash: true }`.
   * TypeORM has no global omit, so without this the hash would be returned by
   * every endpoint that selects a user. Anything that legitimately needs it
   * (the login lookup) must opt in explicitly via `addSelect`.
   */
  @Column({ type: "varchar", select: false })
  passwordHash: string;

  @Column({ type: "varchar" })
  fullName: string;

  @Column({ type: "varchar", default: "customer" })
  role: string;

  @Column({ type: "timestamp", precision: 6, default: () => "now()" })
  createdAt: Date;

  /**
   * The branch this staff member is responsible for. Only meaningful for
   * pharmacist_reviewer accounts, and nullable so that admins (who oversee
   * every branch) and customers need no branch, and so a pharmacist can be
   * created before a branch is chosen. Their whole area is scoped by this id,
   * so an unassigned pharmacist sees an empty area with a prompt to ask an
   * admin to set it, rather than another branch's data.
   */
  @Index("IDX_user_locationId")
  @Column({ type: "uuid", nullable: true })
  locationId: string | null;

  @ManyToOne(() => PharmacyLocation, (location) => location.pharmacists, {
    // Restrict (not SetNull or Cascade) so a branch can never be deleted while
    // staff are still assigned to it — the foreign-key handler turns that into
    // a clean 409 instead of silently orphaning an account that no longer has
    // a branch to work in.
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "locationId", foreignKeyConstraintName: "user_locationId_fkey" })
  location: PharmacyLocation | null;

  @OneToMany(() => Article, (article) => article.author)
  authoredArticles: Article[];

  @OneToMany(() => Article, (article) => article.reviewer)
  reviewedArticles: Article[];

  @OneToMany(() => AuditLog, (log) => log.actor)
  auditLogs: AuditLog[];

  @OneToMany(() => ContactInquiry, (inquiry) => inquiry.user)
  contactInquiries: ContactInquiry[];

  @OneToMany(() => RefillRequest, (request) => request.user)
  refillRequests: RefillRequest[];
}