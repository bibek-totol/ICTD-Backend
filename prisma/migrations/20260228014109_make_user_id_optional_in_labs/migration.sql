-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plainPassword" TEXT;

-- AlterTable
ALTER TABLE "labs" ALTER COLUMN "userId" DROP NOT NULL;
