-- CreateEnum
CREATE TYPE "CoachInsightPattern" AS ENUM ('REVENGE_TRADING', 'HOLDING_LOSERS_TOO_LONG', 'CUTTING_WINNERS_SHORT', 'TIME_OF_DAY_WEAKNESS', 'TAG_CORRELATION', 'OVERTRADING', 'POSITION_SIZE_INCONSISTENCY');

-- CreateEnum
CREATE TYPE "CoachInsightStatus" AS ENUM ('NEW', 'CONFIRMED', 'DISMISSED');

-- CreateTable
CREATE TABLE "coach_insights" (
    "id" TEXT NOT NULL,
    "pattern" "CoachInsightPattern" NOT NULL,
    "status" "CoachInsightStatus" NOT NULL DEFAULT 'NEW',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "relatedTradeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "coach_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coach_insights_userId_idx" ON "coach_insights"("userId");

-- CreateIndex
CREATE INDEX "coach_insights_userId_pattern_idx" ON "coach_insights"("userId", "pattern");

-- AddForeignKey
ALTER TABLE "coach_insights" ADD CONSTRAINT "coach_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
