import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Indexes on every foreign-key column.
 *
 * The Prisma schema declared no indexes at all, so the database only ever had
 * primary keys and unique constraints — no index on any of the eleven foreign
 * keys. Postgres does not create these automatically, which leaves every
 * relation load (an article with its author, a pharmacist's branch-scoped
 * inquiries) and every ON DELETE referential check doing a sequential scan.
 *
 * All IF NOT EXISTS, so this is safe to re-run.
 */
export class AddForeignKeyIndexes1730000001000 implements MigrationInterface {
  name = "AddForeignKeyIndexes1730000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_article_authorId" ON "article" ("authorId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_article_reviewerId" ON "article" ("reviewerId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_log_actorId" ON "audit_log" ("actorId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_contact_inquiry_userId" ON "contact_inquiry" ("userId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_contact_inquiry_locationId" ON "contact_inquiry" ("locationId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_refill_request_userId" ON "refill_request" ("userId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_refill_request_locationId" ON "refill_request" ("locationId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_team_member_locationId" ON "team_member" ("locationId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_categoryId" ON "product" ("categoryId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_service_categoryId" ON "service" ("categoryId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_locationId" ON "user" ("locationId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_locationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_categoryId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_categoryId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_team_member_locationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refill_request_locationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refill_request_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contact_inquiry_locationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contact_inquiry_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_log_actorId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_reviewerId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_authorId"`);
  }
}