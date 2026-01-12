-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ErrorSource" AS ENUM ('API', 'DATABASE', 'AUTH', 'SYSTEM', 'EXTERNAL_SERVICE');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'DEBUG');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SuperAdmin', 'DivisionAdmin', 'DistrictAdmin', 'UpazilaAdmin', 'LabAdmin');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" BIGINT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL,
    "verificationCode" TEXT,
    "verificationExpiry" TIMESTAMP(3),
    "resetPasswordCode" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

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
