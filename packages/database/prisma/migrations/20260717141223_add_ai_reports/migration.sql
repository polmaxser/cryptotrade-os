-- CreateEnum
CREATE TYPE "AiReportType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "ai_reports" (
    "id" TEXT NOT NULL,
    "type" "AiReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_reports_userId_idx" ON "ai_reports"("userId");

-- CreateIndex
CREATE INDEX "ai_reports_userId_type_idx" ON "ai_reports"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ai_reports_userId_type_periodStart_key" ON "ai_reports"("userId", "type", "periodStart");

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
