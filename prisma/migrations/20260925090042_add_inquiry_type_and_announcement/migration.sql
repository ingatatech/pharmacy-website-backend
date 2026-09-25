-- AlterTable
ALTER TABLE "contact_inquiry" ADD COLUMN     "inquiryType" VARCHAR;

-- AlterTable
ALTER TABLE "site_setting" ADD COLUMN     "announcementActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "announcementMessage" VARCHAR(500);
