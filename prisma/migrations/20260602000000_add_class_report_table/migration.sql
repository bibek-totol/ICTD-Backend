CREATE TABLE IF NOT EXISTS "ClassReport" (
  "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);

ALTER TABLE "ClassReport"
  ADD COLUMN IF NOT EXISTS "labId" INTEGER,
  ADD COLUMN IF NOT EXISTS "ictdlLabId" INTEGER,
  ADD COLUMN IF NOT EXISTS "submittedByUserId" UUID,
  ADD COLUMN IF NOT EXISTS "instituteAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "labEstablishedAt" TEXT,
  ADD COLUMN IF NOT EXISTS "computerCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "otherEquipmentCount" TEXT,
  ADD COLUMN IF NOT EXISTS "digitalLabStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "digitalLabStatusDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "renovationRouteStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "renovationRouteStatusDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "renovationRouteDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "labClassRegister" TEXT,
  ADD COLUMN IF NOT EXISTS "labClassRegisterDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "labCameraStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "labCameraStatusDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "internetConnectionStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "internetConnectionStatusDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "internetConnectionDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "sofRoboticsStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "currentStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "reportSummary" TEXT,
  ADD COLUMN IF NOT EXISTS "reportDetails" JSONB,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ClassReport"
  ALTER COLUMN "labId" TYPE INTEGER
  USING CASE
    WHEN "labId"::text ~ '^[0-9]+$' THEN "labId"::text::integer
    ELSE NULL
  END;

ALTER TABLE "ClassReport"
  ALTER COLUMN "ictdlLabId" TYPE INTEGER
  USING CASE
    WHEN "ictdlLabId"::text ~ '^[0-9]+$' THEN "ictdlLabId"::text::integer
    ELSE NULL
  END;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ClassReport_labId_fkey'
  ) THEN
    ALTER TABLE "ClassReport"
      ADD CONSTRAINT "ClassReport_labId_fkey"
      FOREIGN KEY ("labId") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ClassReport_ictdlLabId_fkey'
  ) THEN
    ALTER TABLE "ClassReport"
      ADD CONSTRAINT "ClassReport_ictdlLabId_fkey"
      FOREIGN KEY ("ictdlLabId") REFERENCES "ictdl_labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ClassReport_submittedByUserId_fkey'
  ) THEN
    ALTER TABLE "ClassReport"
      ADD CONSTRAINT "ClassReport_submittedByUserId_fkey"
      FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ClassReport_labId_idx"
  ON "ClassReport" ("labId");

CREATE INDEX IF NOT EXISTS "ClassReport_ictdlLabId_idx"
  ON "ClassReport" ("ictdlLabId");

CREATE INDEX IF NOT EXISTS "ClassReport_submittedByUserId_idx"
  ON "ClassReport" ("submittedByUserId");
