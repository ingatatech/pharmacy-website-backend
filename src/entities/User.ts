import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type UserRole = "admin" | "pharmacist_reviewer";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  // Excluded from default queries (including relations like Article.author or
  // AuditLog.actor) so it never leaks in an API response by accident. Login
  // explicitly re-selects it to verify the password.
  @Column({ select: false })
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ type: "varchar", default: "admin" })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}
