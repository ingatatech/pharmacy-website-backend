import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type UserRole = "admin" | "pharmacist_reviewer";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ type: "varchar", default: "admin" })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}
