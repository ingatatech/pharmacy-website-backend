import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

export type ArticleStatus = "draft" | "pending_review" | "approved" | "published";

@Entity()
export class Article {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column("text")
  content: string;

  @Column({ type: "varchar", nullable: true })
  featuredImageUrl: string | null;

  @Column({ type: "varchar", nullable: true })
  category: string | null;

  @Column("simple-array", { nullable: true })
  tags: string[] | null;

  @ManyToOne(() => User)
  @JoinColumn()
  author: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  reviewer: User | null;

  @Column({ type: "varchar", default: "draft" })
  status: ArticleStatus;

  @Column({ type: "timestamp", nullable: true })
  publishedAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  lastReviewedAt: Date | null;

  @Column({ type: "varchar", nullable: true })
  metaTitle: string | null;

  @Column({ type: "text", nullable: true })
  metaDescription: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
