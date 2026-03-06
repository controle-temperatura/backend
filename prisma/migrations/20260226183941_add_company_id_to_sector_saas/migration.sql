-- AlterTable
ALTER TABLE "Sector" ADD COLUMN     "companyId" TEXT;

-- CreateIndex
CREATE INDEX "Sector_companyId_idx" ON "Sector"("companyId");

-- AddForeignKey
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
