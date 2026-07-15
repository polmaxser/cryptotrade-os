-- AlterTable
ALTER TABLE "portfolios" ADD COLUMN     "startingBalance" DECIMAL(20,8);

-- AlterTable
ALTER TABLE "trades" ADD COLUMN     "stopLossPrice" DECIMAL(20,8);
