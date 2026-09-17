-- market_overview_snapshots is disposable, regenerated cache (a new row is
-- created on every cache-miss or the daily cron pre-warm) — safe to clear
-- rather than backfill, unlike a real user-data migration.
TRUNCATE TABLE "market_overview_snapshots";

-- AlterTable
ALTER TABLE "market_overview_snapshots" DROP COLUMN "summary",
ADD COLUMN "drivers" JSONB NOT NULL;
