-- AlterEnum
ALTER TYPE "ExchangeProvider" ADD VALUE 'OKX';

-- AlterEnum
ALTER TYPE "TradeSource" ADD VALUE 'OKX';

-- AlterTable
ALTER TABLE "exchange_connections" ADD COLUMN     "encryptedApiPassphrase" TEXT;
