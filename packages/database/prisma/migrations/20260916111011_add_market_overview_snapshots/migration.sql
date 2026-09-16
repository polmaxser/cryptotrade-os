-- CreateEnum
CREATE TYPE "MarketSentiment" AS ENUM ('RISK_ON', 'RISK_OFF', 'NEUTRAL');

-- CreateTable
CREATE TABLE "market_overview_snapshots" (
    "id" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentiment" "MarketSentiment" NOT NULL,
    "summary" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "market_overview_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_overview_snapshots_capturedAt_idx" ON "market_overview_snapshots"("capturedAt");
