-- AlterTable
ALTER TABLE "contact_inquiry" ADD COLUMN     "userId" UUID;

-- AlterTable
ALTER TABLE "refill_request" ADD COLUMN     "userId" UUID;

-- AddForeignKey
ALTER TABLE "contact_inquiry" ADD CONSTRAINT "contact_inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refill_request" ADD CONSTRAINT "refill_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
