import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds a 1-5 star rating to testimonials.
 *
 * The homepage testimonial cards are gaining a star row, which needs a value to
 * render. Defaulting to 5 keeps every pre-existing row rendering as a full
 * rating rather than as five empty stars, and the default matches what the
 * admin form sends when the field is left untouched.
 *
 * IF NOT EXISTS / IF EXISTS so this is safe to re-run.
 */
export class AddTestimonialStarRating1730000002000 implements MigrationInterface {
  name = "AddTestimonialStarRating1730000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "testimonial" ADD COLUMN IF NOT EXISTS "starRating" integer NOT NULL DEFAULT 5`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "testimonial" DROP COLUMN IF EXISTS "starRating"`);
  }
}
