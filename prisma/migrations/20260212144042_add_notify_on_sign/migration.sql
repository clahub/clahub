-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "githubId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "oauthToken" TEXT,
    "role" TEXT NOT NULL DEFAULT 'contributor',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scope" TEXT NOT NULL DEFAULT 'repo',
    "githubRepoId" TEXT,
    "githubOrgId" TEXT,
    "ownerName" TEXT NOT NULL,
    "repoName" TEXT,
    "ownerId" INTEGER NOT NULL,
    "notifyOnSign" BOOLEAN NOT NULL DEFAULT false,
    "installationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Agreement_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgreementVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agreementId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "changelog" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgreementVersion_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgreementField" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agreementId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgreementField_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "agreementId" INTEGER NOT NULL,
    "versionId" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'online',
    "ipAddress" TEXT,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "Signature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Signature_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Signature_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AgreementVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "signatureId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "value" TEXT,
    CONSTRAINT "FieldEntry_signatureId_fkey" FOREIGN KEY ("signatureId") REFERENCES "Signature" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FieldEntry_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "AgreementField" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exclusion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agreementId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "githubLogin" TEXT,
    "githubTeamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exclusion_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_githubRepoId_key" ON "Agreement"("githubRepoId");

-- CreateIndex
CREATE INDEX "Agreement_ownerId_idx" ON "Agreement"("ownerId");

-- CreateIndex
CREATE INDEX "Agreement_githubOrgId_idx" ON "Agreement"("githubOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementVersion_agreementId_version_key" ON "AgreementVersion"("agreementId", "version");

-- CreateIndex
CREATE INDEX "AgreementField_agreementId_idx" ON "AgreementField"("agreementId");

-- CreateIndex
CREATE INDEX "Signature_agreementId_idx" ON "Signature"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "Signature_userId_agreementId_key" ON "Signature"("userId", "agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldEntry_signatureId_fieldId_key" ON "FieldEntry"("signatureId", "fieldId");

-- CreateIndex
CREATE INDEX "Exclusion_agreementId_idx" ON "Exclusion"("agreementId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
