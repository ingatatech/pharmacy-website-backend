-- Give pharmacist_reviewer accounts a real branch, instead of inferring one
-- from free-text branch-name columns on refill requests and enquiries (which a
-- typo or a renamed branch silently breaks). Same shape TeamMember already
-- uses for its optional per-branch link.

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "locationId" UUID;
ALTER TABLE "refill_request" ADD COLUMN     "locationId" UUID;
ALTER TABLE "contact_inquiry" ADD COLUMN     "locationId" UUID;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "pharmacy_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refill_request" ADD CONSTRAINT "refill_request_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "pharmacy_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_inquiry" ADD CONSTRAINT "contact_inquiry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "pharmacy_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
