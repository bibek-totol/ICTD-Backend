/*
  Warnings:

  - The `lat` column on the `labs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `long` column on the `labs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "labs" DROP COLUMN "lat",
ADD COLUMN     "lat" DOUBLE PRECISION,
DROP COLUMN "long",
ADD COLUMN     "long" DOUBLE PRECISION;
