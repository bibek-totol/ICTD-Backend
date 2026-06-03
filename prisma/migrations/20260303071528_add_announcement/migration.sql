-- CreateTable
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "serial" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
