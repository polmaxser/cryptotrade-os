-- CreateEnum
CREATE TYPE "TradeSource" AS ENUM ('MANUAL', 'BINANCE');

-- CreateEnum
CREATE TYPE "ExchangeProvider" AS ENUM ('BINANCE');

-- AlterTable
ALTER TABLE "trades" ADD COLUMN     "exchangeConnectionId" TEXT,
ADD COLUMN     "source" "TradeSource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "exchange_connections" (
    "id" TEXT NOT NULL,
    "exchange" "ExchangeProvider" NOT NULL,
    "label" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "encryptedApiSecret" TEXT NOT NULL,
    "apiKeyPreview" TEXT NOT NULL,
    "lastImportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "exchange_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_connections_userId_idx" ON "exchange_connections"("userId");

-- CreateIndex
CREATE INDEX "trades_exchangeConnectionId_idx" ON "trades"("exchangeConnectionId");

-- AddForeignKey
ALTER TABLE "exchange_connections" ADD CONSTRAINT "exchange_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_exchangeConnectionId_fkey" FOREIGN KEY ("exchangeConnectionId") REFERENCES "exchange_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
