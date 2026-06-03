-- AlterTable
ALTER TABLE "labs" ADD COLUMN     "institutionImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "labImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
