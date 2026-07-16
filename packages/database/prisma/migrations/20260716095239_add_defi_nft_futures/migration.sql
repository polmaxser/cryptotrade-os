-- CreateEnum
CREATE TYPE "MarginType" AS ENUM ('ISOLATED', 'CROSS');

-- CreateEnum
CREATE TYPE "DeFiPositionType" AS ENUM ('LIQUIDITY_POOL', 'STAKING', 'LENDING', 'BORROWING', 'YIELD_FARMING');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PortfolioType" ADD VALUE 'FUTURES';
ALTER TYPE "PortfolioType" ADD VALUE 'DEFI';
ALTER TYPE "PortfolioType" ADD VALUE 'NFT';

-- AlterTable
ALTER TABLE "trades" ADD COLUMN     "leverage" INTEGER,
ADD COLUMN     "marginType" "MarginType";

-- CreateTable
CREATE TABLE "defi_positions" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "type" "DeFiPositionType" NOT NULL,
    "asset" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "valueUsd" DECIMAL(20,2) NOT NULL,
    "apy" DECIMAL(6,2),
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "portfolioId" TEXT,

    CONSTRAINT "defi_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nft_holdings" (
    "id" TEXT NOT NULL,
    "collectionName" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "contractAddress" TEXT,
    "imageUrl" TEXT,
    "acquiredPriceUsd" DECIMAL(20,2),
    "currentFloorPriceUsd" DECIMAL(20,2),
    "notes" TEXT,
    "acquiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "portfolioId" TEXT,

    CONSTRAINT "nft_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "defi_positions_userId_idx" ON "defi_positions"("userId");

-- CreateIndex
CREATE INDEX "defi_positions_portfolioId_idx" ON "defi_positions"("portfolioId");

-- CreateIndex
CREATE INDEX "nft_holdings_userId_idx" ON "nft_holdings"("userId");

-- CreateIndex
CREATE INDEX "nft_holdings_portfolioId_idx" ON "nft_holdings"("portfolioId");

-- AddForeignKey
ALTER TABLE "defi_positions" ADD CONSTRAINT "defi_positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defi_positions" ADD CONSTRAINT "defi_positions_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_holdings" ADD CONSTRAINT "nft_holdings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_holdings" ADD CONSTRAINT "nft_holdings_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
