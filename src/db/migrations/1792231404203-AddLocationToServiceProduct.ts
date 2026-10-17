import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationToServiceProduct1792231404203 implements MigrationInterface {
  name = "AddLocationToServiceProduct1792231404203";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "locationId" uuid`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_service_locationId" ON "service" ("locationId")`
    );
    await queryRunner.query(
      `ALTER TABLE "service" ADD CONSTRAINT "FK_service_location" FOREIGN KEY ("locationId") REFERENCES "pharmacy_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "locationId" uuid`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_locationId" ON "product" ("locationId")`
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "FK_product_location" FOREIGN KEY ("locationId") REFERENCES "pharmacy_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "FK_product_location"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_product_locationId"`
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN IF EXISTS "locationId"`);

    await queryRunner.query(
      `ALTER TABLE "service" DROP CONSTRAINT IF EXISTS "FK_service_location"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_service_locationId"`
    );
    await queryRunner.query(`ALTER TABLE "service" DROP COLUMN IF EXISTS "locationId"`);
  }
}
