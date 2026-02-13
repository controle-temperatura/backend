/*
  Warnings:

  - Added the required column `measurementTime` to the `TemperatureRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TemperatureRecord" ADD COLUMN     "measurementTime" TEXT NOT NULL;
