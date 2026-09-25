-- AlterTable
ALTER TABLE "site_setting" ADD COLUMN     "companyHistory" TEXT;

-- CreateTable
CREATE TABLE "testimonial" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customerName" VARCHAR NOT NULL,
    "customerCategory" VARCHAR,
    "testimonialText" TEXT NOT NULL,
    "photoUrl" VARCHAR,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonial_pkey" PRIMARY KEY ("id")
);
