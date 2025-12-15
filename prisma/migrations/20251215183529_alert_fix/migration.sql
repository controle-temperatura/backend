/*
  Warnings:

  - You are about to drop the column `correctiveAction` on the `TemperatureRecord` table. All the data in the column will be lost.
  - Added the required column `danger` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Alert` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('BELOW_MIN', 'ABOVE_MAX', 'NEXT_MIN', 'NEXT_MAX');

-- CreateEnum
CREATE TYPE "AlertDanger" AS ENUM ('CRITICAL', 'ALERT');

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "correctiveAction" TEXT,
ADD COLUMN     "danger" "AlertDanger" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "AlertType" NOT NULL;

-- AlterTable
ALTER TABLE "TemperatureRecord" DROP COLUMN "correctiveAction";
