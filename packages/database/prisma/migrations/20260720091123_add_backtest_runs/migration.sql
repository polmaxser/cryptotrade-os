-- CreateEnum
CREATE TYPE "BacktestTemplate" AS ENUM ('MA_CROSSOVER', 'RSI_THRESHOLD', 'DONCHIAN_BREAKOUT');

-- CreateTable
CREATE TABLE "backtest_runs" (
    "id" TEXT NOT NULL,
    "template" "BacktestTemplate" NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "params" JSONB NOT NULL,
    "startingCapital" DECIMAL(20,2) NOT NULL,
    "feePercent" DECIMAL(6,4) NOT NULL DEFAULT 0.1,
    "summary" JSONB NOT NULL,
    "equityCurve" JSONB NOT NULL,
    "trades" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT,

    CONSTRAINT "backtest_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backtest_runs_userId_idx" ON "backtest_runs"("userId");

-- CreateIndex
CREATE INDEX "backtest_runs_strategyId_idx" ON "backtest_runs"("strategyId");

-- AddForeignKey
ALTER TABLE "backtest_runs" ADD CONSTRAINT "backtest_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backtest_runs" ADD CONSTRAINT "backtest_runs_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
