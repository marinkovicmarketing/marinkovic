-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "pick" TEXT NOT NULL,
    "odds" REAL NOT NULL,
    "confidence" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "slateDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tip_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tip" ("confidence", "createdAt", "id", "isFree", "market", "matchId", "odds", "pick", "reasoning", "slateDate") SELECT "confidence", "createdAt", "id", "isFree", "market", "matchId", "odds", "pick", "reasoning", "slateDate" FROM "Tip";
DROP TABLE "Tip";
ALTER TABLE "new_Tip" RENAME TO "Tip";
CREATE INDEX "Tip_slateDate_idx" ON "Tip"("slateDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
