import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Weekly pharmacist roster. Each row is one recurring shift: a published team
 * member, a branch, a weekday (0 = Sunday … 6 = Saturday) and a start/end time
 * stored as "HH:MM".
 */
export class AddPharmacistShift1792400000000 implements MigrationInterface {
  name = "AddPharmacistShift1792400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pharmacist_shift" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "teamMemberId" uuid NOT NULL,
        "locationId" uuid NOT NULL,
        "dayOfWeek" smallint NOT NULL,
        "startTime" varchar(5) NOT NULL,
        "endTime" varchar(5) NOT NULL,
        "note" varchar(120),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp(6) NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pharmacist_shift" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_pharmacist_shift_day" CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6),
        CONSTRAINT "CHK_pharmacist_shift_time" CHECK ("startTime" < "endTime")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pharmacist_shift_teamMemberId" ON "pharmacist_shift" ("teamMemberId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pharmacist_shift_locationId" ON "pharmacist_shift" ("locationId")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_pharmacist_shift_slot" ON "pharmacist_shift" ("locationId", "teamMemberId", "dayOfWeek", "startTime")`
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        ALTER TABLE "pharmacist_shift"
          ADD CONSTRAINT "FK_pharmacist_shift_teamMember"
          FOREIGN KEY ("teamMemberId") REFERENCES "team_member"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        ALTER TABLE "pharmacist_shift"
          ADD CONSTRAINT "FK_pharmacist_shift_location"
          FOREIGN KEY ("locationId") REFERENCES "pharmacy_location"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pharmacist_shift"`);
  }
}
