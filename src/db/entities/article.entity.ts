import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("article")
export class Article {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar", unique: true })
  slug: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "varchar", nullable: true })
  featuredImageUrl: string | null;

  @Column({ type: "varchar", nullable: true })
  category: string | null;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  tags: string[];

  @Column({ type: "varchar", default: "draft" })
  status: string;

  @Column({ type: "timestamp", precision: 6, nullable: true })
  publishedAt: Date | null;

  @Column({ type: "timestamp", precision: 6, nullable: true })
  lastReviewedAt: Date | null;

  @Column({ type: "varchar", nullable: true })
  metaTitle: string | null;

  @Column({ type: "text", nullable: true })
  metaDescription: string | null;

  @Column({ type: "timestamp", precision: 6, default: () => "now()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 6 })
  updatedAt: Date;

  @Index("IDX_article_authorId")
  @Column({ type: "uuid", nullable: true })
  authorId: string | null;

  @Index("IDX_article_reviewerId")
  @Column({ type: "uuid", nullable: true })
  reviewerId: string | null;

  @ManyToOne(() => User, (user) => user.authoredArticles, {
    onDelete: "NO ACTION",
  })
  @JoinColumn({
    name: "authorId",
    foreignKeyConstraintName: "FK_a9c5f4ec6cceb1604b4a3c84c87",
  })
  author: User | null;

  @ManyToOne(() => User, (user) => user.reviewedArticles, {
    onDelete: "NO ACTION",
  })
  @JoinColumn({
    name: "reviewerId",
    foreignKeyConstraintName: "FK_ad9fe17bba7abceb04678d05e4f",
  })
  reviewer: User | null;
}