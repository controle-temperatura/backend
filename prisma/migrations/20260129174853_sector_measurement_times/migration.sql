-- AlterTable
ALTER TABLE "Sector" ADD COLUMN     "measurementTimes" TEXT[] DEFAULT ARRAY['12:00']::TEXT[];
