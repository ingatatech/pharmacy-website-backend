import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Pins the set of roles the database will accept on "user"."role" to exactly
 * the three the application knows about. Until now this was plain varchar
 * (created by the baseline schema with DEFAULT 'customer'), so the database
 * would happily store any string; the only thing keeping it to the three real
 * roles was the code in src/validators/user.validator.ts. This adds the last
 * line of defence at the storage layer.
 *
 * Safe to run on the existing Render database:
 * - It only ADDs a constraint; it never rewrites or drops data.
 * - The constraint is added inside a guard that checks pg_constraint first, so
 *   running it twice (or against a database that already has an equivalent
 *   constraint) is a harmless no-op rather than a "constraint already exists"
 *   error.
 * - Every row the application has ever written uses one of these three values
 *   (self-registration and the seed script write 'customer'/'admin', and the
 *   admin API writes 'pharmacist_reviewer'/'customer'), so validation passes.
 */
export class AddUserRoleCheckConstraint1792300000000 implements MigrationInterface {
  name = "AddUserRoleCheckConstraint1792300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'CHK_user_role'
        ) THEN
          ALTER TABLE "user"
            ADD CONSTRAINT "CHK_user_role"
            CHECK ("role" IN ('admin', 'pharmacist_reviewer', 'customer'));
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "CHK_user_role"`);
  }
}
