import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  actor: User;

  @Column()
  method: string;

  @Column()
  path: string;

  @Column({ type: "int" })
  statusCode: number;

  @CreateDateColumn()
  createdAt: Date;
}
