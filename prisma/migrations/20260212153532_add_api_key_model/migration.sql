-- CreateTable
CREATE TABLE "ApiKey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");
