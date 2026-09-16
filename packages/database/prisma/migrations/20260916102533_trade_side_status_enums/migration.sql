-- Trade.side/Trade.status were free-text `String` columns despite every
-- other status-like field on the schema already being a proper enum. All
-- 267 existing rows only ever contain 'LONG'/'SHORT' and 'OPEN'/'CLOSED',
-- so this casts the existing values in place rather than dropping the
-- column (which is what Prisma's own auto-generated diff would do here).

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable: side
ALTER TABLE "trades" ALTER COLUMN "side" TYPE "TradeSide" USING ("side"::"TradeSide");

-- AlterTable: status (drop/re-add the default around the cast — Postgres
-- won't cast a column that still has a text-typed DEFAULT attached)
ALTER TABLE "trades" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "trades" ALTER COLUMN "status" TYPE "TradeStatus" USING ("status"::"TradeStatus");
ALTER TABLE "trades" ALTER COLUMN "status" SET DEFAULT 'OPEN';
