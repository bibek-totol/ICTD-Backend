-- CreateTable
CREATE TABLE "ictdl_labs" (
    "id" SERIAL NOT NULL,
    "district" VARCHAR(255) NOT NULL,
    "upazila" VARCHAR(255) NOT NULL,
    "institute" VARCHAR(500) NOT NULL,
    "head" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "labImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "institutionImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ictdl_labs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ictdl_district" ON "ictdl_labs"("district");

-- CreateIndex
CREATE INDEX "idx_ictdl_upazila" ON "ictdl_labs"("upazila");

-- CreateIndex
CREATE INDEX "idx_ictdl_institute" ON "ictdl_labs"("institute");
