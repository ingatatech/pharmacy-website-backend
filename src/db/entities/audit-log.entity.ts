import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("audit_log")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  method: string;

  @Column({ type: "varchar" })
  path: string;

  @Column({ type: "integer" })
  statusCode: number;

  @Column({ type: "timestamp", precision: 6, default: () => "now()" })
  createdAt: Date;

  @Index("IDX_audit_log_actorId")
  @Column({ type: "uuid", nullable: true })
  actorId: string | null;

  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: "NO ACTION" })
  @JoinColumn({ name: "actorId", foreignKeyConstraintName: "FK_cb6aa6f6fd56f08eafb60316225" })
  actor: User | null;
}