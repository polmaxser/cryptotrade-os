-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExchangeProvider" ADD VALUE 'GATEIO';
ALTER TYPE "ExchangeProvider" ADD VALUE 'HYPERLIQUID';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TradeSource" ADD VALUE 'GATEIO';
ALTER TYPE "TradeSource" ADD VALUE 'HYPERLIQUID';

-- AlterTable
ALTER TABLE "exchange_connections" ADD COLUMN     "encryptedWalletAddress" TEXT,
ALTER COLUMN "encryptedApiKey" DROP NOT NULL,
ALTER COLUMN "encryptedApiSecret" DROP NOT NULL;
