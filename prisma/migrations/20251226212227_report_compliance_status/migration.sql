/*
  Warnings:

  - Added the required column `complianceStatus` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "complianceStatus" "ComplianceStatus" NOT NULL;
