import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Baseline schema, replacing the eight Prisma migrations that preceded it.
 *
 * Every statement is written to be safe to run against a database that already
 * has this schema: tables use CREATE TABLE IF NOT EXISTS, unique indexes use
 * CREATE UNIQUE INDEX IF NOT EXISTS, and foreign keys are added inside DO
 * blocks that swallow the duplicate_object error.
 *
 * That matters because this migration has to serve two populations at once —
 * databases already carrying the Prisma-built schema (production and existing
 * deployments) and brand-new empty databases. A normal generated migration
 * would fail on the former, since CREATE TABLE would collide. TypeORM also
 * only ever runs a given migration once per database, so on an existing
 * deployment this is effectively a no-op apart from the timestamp-default
 * normalisation at the end.
 *
 * Note the mixed casing: table names are snake_case (as Prisma's @@map left
 * them) while column names are camelCase (Prisma's default, since no field
 * carried a @map). Both match what the existing database contains.
 */
export class InitialSchema1730000000000 implements MigrationInterface {
  name = "InitialSchema1730000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The primary keys default to uuid_generate_v4(), so the extension has to
    // exist before any table is created.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "article" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "content" text NOT NULL,
        "featuredImageUrl" varchar,
        "category" varchar,
        "tags" text[] NOT NULL DEFAULT '{}'::text[],
        "status" varchar NOT NULL DEFAULT 'draft',
        "publishedAt" timestamp(6),
        "lastReviewedAt" timestamp(6),
        "metaTitle" varchar,
        "metaDescription" text,
        "createdAt" timestamp(6) NOT NULL DEFAULT now(),
        "updatedAt" timestamp(6) NOT NULL DEFAULT now(),
        "authorId" uuid,
        "reviewerId" uuid,
        CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "method" varchar NOT NULL,
        "path" varchar NOT NULL,
        "statusCode" integer NOT NULL,
        "createdAt" timestamp(6) NOT NULL DEFAULT now(),
        "actorId" uuid,
        CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "category" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "type" varchar NOT NULL,
        CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contact_inquiry" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fullName" varchar NOT NULL,
        "phoneNumber" varchar NOT NULL,
        "email" varchar NOT NULL,
        "subject" varchar,
        "inquiryType" varchar,
        "message" text NOT NULL,
        "preferredContactMethod" varchar,
        "preferredBranch" varchar,
        "status" varchar NOT NULL DEFAULT 'new',
        "createdAt" timestamp(6) NOT NULL DEFAULT now(),
        "userId" uuid,
        "locationId" uuid,
        CONSTRAINT "PK_1eb681c80ab4415aa7e15c5be1d" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "faq" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "question" text NOT NULL,
        "answer" text NOT NULL,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isPublished" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_d6f5a52b1a96dd8d0591f9fbc47" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pharmacy_location" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" varchar NOT NULL,
        "branchName" varchar NOT NULL,
        "address" varchar NOT NULL,
        "telephone" varchar,
        "latitude" double precision,
        "longitude" double precision,
        "openingHours" jsonb,
        "availableServices" text[] NOT NULL DEFAULT '{}'::text[],
        "isActive" boolean NOT NULL DEFAULT true,
        "description" text,
        "photoUrl" varchar,
        CONSTRAINT "PK_d4c336c60a927bdc324d78f0bea" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "brandName" varchar,
        "generalDescription" text,
        "generalUse" text,
        "precautions" text,
        "storageInformation" text,
        "activeIngredient" varchar,
        "formStrength" varchar,
        "manufacturer" varchar,
        "dosageInformation" text,
        "requiresPrescription" boolean NOT NULL DEFAULT false,
        "availabilityStatus" varchar NOT NULL DEFAULT 'unknown',
        "imageUrl" varchar,
        "isPublished" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp(6) NOT NULL DEFAULT now(),
        "updatedAt" timestamp(6) NOT NULL DEFAULT now(),
        "categoryId" uuid,
        "metaTitle" varchar,
        "metaDescription" text,
        CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refill_request" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fullName" varchar NOT NULL,
        "phoneNumber" varchar NOT NULL,
        "email" varchar,
        "preferredBranch" varchar,
        "prescriptionReference" varchar,
        "medicationName" varchar,
        "additionalNotes" text,
        "preferredPickupMethod" varchar,
        "status" varchar NOT NULL DEFAULT 'submitted',
        "createdAt" timestamp(6) NOT NULL DEFAULT now(),
        "userId" uuid,
        "locationId" uuid,
        CONSTRAINT "PK_234a5dd8a2c23a899e2effa1a99" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "shortDescription" text NOT NULL,
        "detailedDescription" text,
        "imageUrl" varchar,
        "keyBenefit" text,
        "intendedCustomers" text,
        "requirements" text,
        "process" text,
        "limitations" text,
        "isPublished" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp(6) NOT NULL DEFAULT now(),
        "updatedAt" timestamp(6) NOT NULL DEFAULT now(),
        "categoryId" uuid,
        "metaTitle" varchar,
        "metaDescription" text,
        CONSTRAINT "PK_85a21558c006647cd76fdce044b" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "site_setting" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pharmacyName" varchar,
        "aboutUs" text,
        "mission" text,
        "vision" text,
        "companyHistory" text,
        "coreValues" text[] NOT NULL DEFAULT '{}'::text[],
        "whyChooseUs" text,
        "heroHeadline" varchar,
        "heroSubheading" text,
        "phone" varchar,
        "email" varchar,
        "address" varchar,
        "facebookUrl" varchar,
        "instagramUrl" varchar,
        "linkedinUrl" varchar,
        "xUrl" varchar,
        "whatsappUrl" varchar,
        "youtubeUrl" varchar,
        "announcementMessage" varchar(500),
        "announcementActive" boolean NOT NULL DEFAULT false,
        "updatedAt" timestamp(6) NOT NULL DEFAULT now(),
        CONSTRAINT "PK_543f4809a6cf8b4f253a24f55d8" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "team_member" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fullName" varchar NOT NULL,
        "role" varchar NOT NULL,
        "credentials" varchar,
        "bio" text,
        "photoUrl" varchar,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isPublished" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp(6) NOT NULL DEFAULT now(),
        "locationId" uuid,
        CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "testimonial" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customerName" varchar NOT NULL,
        "customerCategory" varchar,
        "testimonialText" text NOT NULL,
        "photoUrl" varchar,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isPublished" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp(6) NOT NULL DEFAULT now(),
        CONSTRAINT "testimonial_pkey" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL,
        "passwordHash" varchar NOT NULL,
        "fullName" varchar NOT NULL,
        "role" varchar NOT NULL DEFAULT 'customer',
        "createdAt" timestamp(6) NOT NULL DEFAULT now(),
        "locationId" uuid,
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
      )
    `);

    // Unique constraints. Names are the ones the Prisma-era schema already used,
    // so on an existing database these are no-ops.
    await this.addUniqueConstraint(
      queryRunner,
      "article",
      "UQ_0ab85f4be07b22d79906671d72f",
      '"slug"',
    );
    await this.addUniqueConstraint(
      queryRunner,
      "category",
      "UQ_cb73208f151aa71cdd78f662d70",
      '"slug"',
    );
    // Not a constraint, unlike the other five. `PharmacyLocation.slug` is
    // declared as an explicit unique *index* on the entity (that is the shape
    // the Prisma-era database has), so creating a constraint here would leave
    // a freshly-migrated database permanently disagreeing with the metadata.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "pharmacy_location_slug_key" ON "pharmacy_location" ("slug")`
    );
    await this.addUniqueConstraint(
      queryRunner,
      "product",
      "UQ_8cfaf4a1e80806d58e3dbe69224",
      '"slug"',
    );
    await this.addUniqueConstraint(
      queryRunner,
      "service",
      "UQ_4df47ef659e04d5be78ddb6b598",
      '"slug"',
    );
    await this.addUniqueConstraint(
      queryRunner,
      "user",
      "UQ_e12875dfb3b1d92d7d7c5377e22",
      '"email"',
    );

    // Foreign keys. Each is added through a DO block so re-running against a
    // database that already has the constraint is a no-op rather than an error.
    await this.addConstraint(
      queryRunner,
      'user',
      'user_locationId_fkey',
      '"locationId"',
      'pharmacy_location',
      '"id"',
      "ON DELETE RESTRICT ON UPDATE CASCADE",
    );
    await this.addConstraint(
      queryRunner,
      'article',
      'FK_a9c5f4ec6cceb1604b4a3c84c87',
      '"authorId"',
      'user',
      '"id"',
      "ON DELETE NO ACTION ON UPDATE NO ACTION",
    );
    await this.addConstraint(
      queryRunner,
      'article',
      'FK_ad9fe17bba7abceb04678d05e4f',
      '"reviewerId"',
      'user',
      '"id"',
      "ON DELETE NO ACTION ON UPDATE NO ACTION",
    );
    await this.addConstraint(
      queryRunner,
      'audit_log',
      'FK_cb6aa6f6fd56f08eafb60316225',
      '"actorId"',
      'user',
      '"id"',
      "ON DELETE NO ACTION ON UPDATE NO ACTION",
    );
    await this.addConstraint(
      queryRunner,
      'contact_inquiry',
      'contact_inquiry_userId_fkey',
      '"userId"',
      'user',
      '"id"',
      "ON DELETE SET NULL ON UPDATE CASCADE",
    );
    await this.addConstraint(
      queryRunner,
      'contact_inquiry',
      'contact_inquiry_locationId_fkey',
      '"locationId"',
      'pharmacy_location',
      '"id"',
      "ON DELETE SET NULL ON UPDATE CASCADE",
    );
    await this.addConstraint(
      queryRunner,
      'refill_request',
      'refill_request_userId_fkey',
      '"userId"',
      'user',
      '"id"',
      "ON DELETE SET NULL ON UPDATE CASCADE",
    );
    await this.addConstraint(
      queryRunner,
      'refill_request',
      'refill_request_locationId_fkey',
      '"locationId"',
      'pharmacy_location',
      '"id"',
      "ON DELETE SET NULL ON UPDATE CASCADE",
    );
    await this.addConstraint(
      queryRunner,
      'team_member',
      'team_member_locationId_fkey',
      '"locationId"',
      'pharmacy_location',
      '"id"',
      "ON DELETE SET NULL ON UPDATE CASCADE",
    );
    await this.addConstraint(
      queryRunner,
      'product',
      'FK_ff0c0301a95e517153df97f6812',
      '"categoryId"',
      'category',
      '"id"',
      "ON DELETE NO ACTION ON UPDATE NO ACTION",
    );
    await this.addConstraint(
      queryRunner,
      'service',
      'FK_cb169715cbb8c74f263ba192ca8',
      '"categoryId"',
      'category',
      '"id"',
      "ON DELETE NO ACTION ON UPDATE NO ACTION",
    );

    // team_member.createdAt and testimonial.createdAt were created by early
    // Prisma migrations with DEFAULT CURRENT_TIMESTAMP, while every other
    // timestamp column uses now(). The two spell the same function, but
    // normalising them keeps the entity metadata and the database in exact
    // agreement so schema diffing reports nothing.
    await queryRunner.query(
      `ALTER TABLE "team_member" ALTER COLUMN "createdAt" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "testimonial" ALTER COLUMN "createdAt" SET DEFAULT now()`
    );
  }

  private async addConstraint(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
    column: string,
    referencedTable: string,
    referencedColumn: string,
    actions: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        ALTER TABLE "${table}"
          ADD CONSTRAINT "${constraintName}"
          FOREIGN KEY (${column}) REFERENCES "${referencedTable}"(${referencedColumn}) ${actions};
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `);
  }

  /**
   * Ensures `table.column` is unique, as a named table constraint.
   *
   * Entity metadata models `@Column({ unique: true })` as a UNIQUE
   * *constraint*, and that is also the shape the Prisma-era database has
   * always had. A bare `CREATE UNIQUE INDEX` would enforce uniqueness just as
   * well, but it leaves the freshly-migrated schema permanently disagreeing
   * with the entity metadata — `db:verify` would never come back clean on a
   * new environment, and the next `migration:generate` would emit a pointless
   * "drop index, add constraint" diff.
   *
   * Three starting states have to converge on the constraint shape, so each
   * step is guarded rather than assumed:
   *   1. a constraint already exists   -> nothing to do
   *   2. a standalone unique index with the same name exists (a database first
   *      migrated by an earlier revision of this file) -> drop it, since the
   *      constraint about to be added would otherwise collide with its name
   *   3. neither exists               -> add the constraint
   */
  private async addUniqueConstraint(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
    column: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = current_schema() AND indexname = '${constraintName}'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = current_schema() AND c.conname = '${constraintName}'
        ) THEN
          EXECUTE 'DROP INDEX "' || current_schema() || '"."${constraintName}"';
        END IF;
      END $$;
    `);

    // Re-adding a unique constraint whose backing index name is taken fails
    // with SQLSTATE 42P07 (duplicate_table), not 42710 (duplicate_object) —
    // which is what a duplicate FOREIGN KEY raises, and therefore what the
    // addConstraint() helper above handles. Both are caught here so this
    // stays a no-op regardless of which one the server reports.
    await queryRunner.query(`
      DO $$
      BEGIN
        ALTER TABLE "${table}"
          ADD CONSTRAINT "${constraintName}" UNIQUE (${column});
      EXCEPTION
        WHEN duplicate_table OR duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse dependency order so no foreign key is left dangling.
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "article"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_inquiry"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refill_request"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "team_member"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pharmacy_location"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "category"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "faq"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "site_setting"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "testimonial"`);
  }
}