-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
-- id columns default to uuid_generate_v4(), which requires this extension.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "article" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "content" TEXT NOT NULL,
    "featuredImageUrl" VARCHAR,
    "category" VARCHAR,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" VARCHAR NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(6),
    "lastReviewedAt" TIMESTAMP(6),
    "metaTitle" VARCHAR,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" UUID,
    "reviewerId" UUID,

    CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "method" VARCHAR NOT NULL,
    "path" VARCHAR NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" UUID,

    CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "type" VARCHAR NOT NULL,

    CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_inquiry" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fullName" VARCHAR NOT NULL,
    "phoneNumber" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "subject" VARCHAR,
    "message" TEXT NOT NULL,
    "preferredContactMethod" VARCHAR,
    "preferredBranch" VARCHAR,
    "status" VARCHAR NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_1eb681c80ab4415aa7e15c5be1d" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PK_d6f5a52b1a96dd8d0591f9fbc47" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_location" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "branchName" VARCHAR NOT NULL,
    "address" VARCHAR NOT NULL,
    "telephone" VARCHAR,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "openingHours" JSONB,
    "availableServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PK_d4c336c60a927bdc324d78f0bea" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "brandName" VARCHAR,
    "generalDescription" TEXT,
    "generalUse" TEXT,
    "precautions" TEXT,
    "storageInformation" TEXT,
    "activeIngredient" VARCHAR,
    "formStrength" VARCHAR,
    "manufacturer" VARCHAR,
    "dosageInformation" TEXT,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "availabilityStatus" VARCHAR NOT NULL DEFAULT 'unknown',
    "imageUrl" VARCHAR,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" UUID,
    "metaTitle" VARCHAR,
    "metaDescription" TEXT,

    CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refill_request" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fullName" VARCHAR NOT NULL,
    "phoneNumber" VARCHAR NOT NULL,
    "email" VARCHAR,
    "preferredBranch" VARCHAR,
    "prescriptionReference" VARCHAR,
    "medicationName" VARCHAR,
    "additionalNotes" TEXT,
    "preferredPickupMethod" VARCHAR,
    "status" VARCHAR NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_234a5dd8a2c23a899e2effa1a99" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "detailedDescription" TEXT,
    "imageUrl" VARCHAR,
    "keyBenefit" TEXT,
    "intendedCustomers" TEXT,
    "requirements" TEXT,
    "process" TEXT,
    "limitations" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" UUID,
    "metaTitle" VARCHAR,
    "metaDescription" TEXT,

    CONSTRAINT "PK_85a21558c006647cd76fdce044b" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_setting" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "pharmacyName" VARCHAR,
    "aboutUs" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "coreValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whyChooseUs" TEXT,
    "heroHeadline" VARCHAR,
    "heroSubheading" TEXT,
    "phone" VARCHAR,
    "email" VARCHAR,
    "address" VARCHAR,
    "facebookUrl" VARCHAR,
    "instagramUrl" VARCHAR,
    "linkedinUrl" VARCHAR,
    "xUrl" VARCHAR,
    "whatsappUrl" VARCHAR,
    "youtubeUrl" VARCHAR,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_543f4809a6cf8b4f253a24f55d8" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR NOT NULL,
    "passwordHash" VARCHAR NOT NULL,
    "fullName" VARCHAR NOT NULL,
    "role" VARCHAR NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_0ab85f4be07b22d79906671d72f" ON "article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_cb73208f151aa71cdd78f662d70" ON "category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_8cfaf4a1e80806d58e3dbe69224" ON "product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_4df47ef659e04d5be78ddb6b598" ON "service"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_e12875dfb3b1d92d7d7c5377e22" ON "user"("email");

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "FK_a9c5f4ec6cceb1604b4a3c84c87" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "FK_ad9fe17bba7abceb04678d05e4f" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "FK_cb6aa6f6fd56f08eafb60316225" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "FK_ff0c0301a95e517153df97f6812" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "FK_cb169715cbb8c74f263ba192ca8" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
