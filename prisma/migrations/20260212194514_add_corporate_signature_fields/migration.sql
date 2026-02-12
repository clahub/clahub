-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Signature" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "agreementId" INTEGER NOT NULL,
    "versionId" INTEGER NOT NULL,
    "signatureType" TEXT NOT NULL DEFAULT 'individual',
    "source" TEXT NOT NULL DEFAULT 'online',
    "ipAddress" TEXT,
    "companyName" TEXT,
    "companyDomain" TEXT,
    "companyTitle" TEXT,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "Signature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Signature_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Signature_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AgreementVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Signature" ("agreementId", "id", "ipAddress", "revokedAt", "signedAt", "source", "userId", "versionId") SELECT "agreementId", "id", "ipAddress", "revokedAt", "signedAt", "source", "userId", "versionId" FROM "Signature";
DROP TABLE "Signature";
ALTER TABLE "new_Signature" RENAME TO "Signature";
CREATE INDEX "Signature_agreementId_idx" ON "Signature"("agreementId");
CREATE INDEX "Signature_companyDomain_idx" ON "Signature"("companyDomain");
CREATE UNIQUE INDEX "Signature_userId_agreementId_key" ON "Signature"("userId", "agreementId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
