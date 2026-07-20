-- CreateEnum
CREATE TYPE "EconomicEventCategory" AS ENUM ('FOMC', 'CPI', 'NFP');

-- CreateEnum
CREATE TYPE "EconomicEventImportance" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "economic_events" (
    "id" TEXT NOT NULL,
    "category" "EconomicEventCategory" NOT NULL,
    "importance" "EconomicEventImportance" NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "forecast" TEXT,
    "previous" TEXT,
    "actual" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "economic_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "economic_events_eventDate_idx" ON "economic_events"("eventDate");

-- CreateIndex
CREATE INDEX "economic_events_category_idx" ON "economic_events"("category");

-- CreateIndex
CREATE UNIQUE INDEX "economic_events_category_eventDate_key" ON "economic_events"("category", "eventDate");
