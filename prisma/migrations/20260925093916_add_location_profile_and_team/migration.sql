-- AlterTable
ALTER TABLE "pharmacy_location" ADD COLUMN     "slug" VARCHAR,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "photoUrl" VARCHAR;

-- CreateTable
CREATE TABLE "team_member" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "fullName" VARCHAR NOT NULL,
    "role" VARCHAR NOT NULL,
    "credentials" VARCHAR,
    "bio" TEXT,
    "photoUrl" VARCHAR,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" UUID,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_location_slug_key" ON "pharmacy_location"("slug");

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "pharmacy_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
