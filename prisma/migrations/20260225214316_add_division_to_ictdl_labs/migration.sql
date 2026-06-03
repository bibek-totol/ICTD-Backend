-- AlterTable
ALTER TABLE "ictdl_labs" ADD COLUMN     "division" VARCHAR(255);

-- AlterTable
ALTER TABLE "labs" ADD COLUMN     "district" VARCHAR(255);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "upazila" TEXT NOT NULL,
    "institute" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "complainantName" TEXT,
    "complainantPhone" TEXT,
    "complaintImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Complaint_division_idx" ON "Complaint"("division");

-- CreateIndex
CREATE INDEX "Complaint_district_idx" ON "Complaint"("district");

-- CreateIndex
CREATE INDEX "Complaint_upazila_idx" ON "Complaint"("upazila");

-- CreateIndex
CREATE INDEX "Complaint_category_idx" ON "Complaint"("category");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "idx_ictdl_division" ON "ictdl_labs"("division");

-- CreateIndex
CREATE INDEX "idx_labs_district" ON "labs"("district");
