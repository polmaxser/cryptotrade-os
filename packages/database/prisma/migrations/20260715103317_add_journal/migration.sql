-- CreateEnum
CREATE TYPE "JournalTagCategory" AS ENUM ('MISTAKE', 'EMOTION', 'STRATEGY');

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "screenshotUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "tradeId" TEXT,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "JournalTagCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "journal_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_JournalEntryToJournalTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JournalEntryToJournalTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "journal_entries_userId_idx" ON "journal_entries"("userId");

-- CreateIndex
CREATE INDEX "journal_entries_tradeId_idx" ON "journal_entries"("tradeId");

-- CreateIndex
CREATE INDEX "journal_tags_userId_idx" ON "journal_tags"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "journal_tags_userId_category_name_key" ON "journal_tags"("userId", "category", "name");

-- CreateIndex
CREATE INDEX "_JournalEntryToJournalTag_B_index" ON "_JournalEntryToJournalTag"("B");

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_tags" ADD CONSTRAINT "journal_tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JournalEntryToJournalTag" ADD CONSTRAINT "_JournalEntryToJournalTag_A_fkey" FOREIGN KEY ("A") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JournalEntryToJournalTag" ADD CONSTRAINT "_JournalEntryToJournalTag_B_fkey" FOREIGN KEY ("B") REFERENCES "journal_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
