-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ErrorSource" AS ENUM ('API', 'DATABASE', 'AUTH', 'SYSTEM', 'EXTERNAL_SERVICE');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'DEBUG');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SuperAdmin', 'DivisionAdmin', 'DistrictAdmin', 'UpazilaAdmin', 'LabAdmin', 'Anonymous');

-- CreateEnum
CREATE TYPE "PageState" AS ENUM ('Default', 'SendVerifiedEmailCode', 'VerifiedEmail', 'Registered');

-- CreateEnum
CREATE TYPE "LabTypes" AS ENUM ('sof', 'ictdl_sof', 'srdl_sof');

-- CreateTable
CREATE TABLE "VisitorLog" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "requestId" TEXT,
    "method" TEXT,
    "path" TEXT,
    "statusCode" INTEGER,
    "durationMs" INTEGER,
    "ip" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "service" TEXT NOT NULL DEFAULT 'api',
    "environment" TEXT NOT NULL DEFAULT 'development',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "errorCode" TEXT,
    "stackTrace" TEXT,
    "severity" "ErrorSeverity" NOT NULL,
    "source" "ErrorSource" NOT NULL,
    "requestId" TEXT,
    "method" TEXT,
    "path" TEXT,
    "statusCode" INTEGER,
    "durationMs" INTEGER,
    "ip" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "service" TEXT NOT NULL DEFAULT 'api',
    "environment" TEXT NOT NULL DEFAULT 'development',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "userName" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT 'govt@doict.pass',
    "phoneNumber" TEXT,
    "altPhoneNumber" TEXT,
    "imageUrl" TEXT NOT NULL DEFAULT 'https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png',
    "usersManagementKey" TEXT,
    "pageState" "PageState" NOT NULL DEFAULT 'Default',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" DEFAULT 'LabAdmin',
    "verificationCode" TEXT,
    "verificationExpiry" TIMESTAMP(3),
    "resetPasswordCode" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labs" (
    "id" SERIAL NOT NULL,
    "division" VARCHAR(255),
    "seat" VARCHAR(255),
    "upazila" VARCHAR(255),
    "institute" VARCHAR(255),
    "lab_type" "LabTypes",
    "userId" UUID NOT NULL,
    "lat" TEXT,
    "long" TEXT,

    CONSTRAINT "labs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitorLog_level_idx" ON "VisitorLog"("level");

-- CreateIndex
CREATE INDEX "VisitorLog_createdAt_idx" ON "VisitorLog"("createdAt");

-- CreateIndex
CREATE INDEX "VisitorLog_requestId_createdAt_idx" ON "VisitorLog"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_severity_idx" ON "ErrorLog"("severity");

-- CreateIndex
CREATE INDEX "ErrorLog_source_idx" ON "ErrorLog"("source");

-- CreateIndex
CREATE INDEX "ErrorLog_occurredAt_idx" ON "ErrorLog"("occurredAt");

-- CreateIndex
CREATE INDEX "ErrorLog_requestId_occurredAt_idx" ON "ErrorLog"("requestId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_altPhoneNumber_key" ON "User"("altPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_usersManagementKey_key" ON "User"("usersManagementKey");

-- CreateIndex
CREATE INDEX "idx_labs_division" ON "labs"("division");

-- CreateIndex
CREATE INDEX "idx_labs_lab_type" ON "labs"("lab_type");

-- CreateIndex
CREATE INDEX "idx_labs_upazila" ON "labs"("upazila");

-- CreateIndex
CREATE INDEX "labs_userId_idx" ON "labs"("userId");

-- AddForeignKey
ALTER TABLE "labs" ADD CONSTRAINT "labs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
