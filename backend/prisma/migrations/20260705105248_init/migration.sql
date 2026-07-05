-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'BLOCKED');

-- CreateTable
CREATE TABLE "regulatory_authorities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_authorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_directives" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "rawStatus" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "publishedDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "isCorrupt" BOOLEAN NOT NULL DEFAULT false,
    "corruptReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_directives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" TEXT NOT NULL,
    "directiveId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee" TEXT,
    "status" "ActionItemStatus" NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actionItemId" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regulatory_authorities_code_key" ON "regulatory_authorities"("code");

-- CreateIndex
CREATE INDEX "compliance_directives_authorityId_idx" ON "compliance_directives"("authorityId");

-- CreateIndex
CREATE INDEX "compliance_directives_rawStatus_idx" ON "compliance_directives"("rawStatus");

-- CreateIndex
CREATE INDEX "compliance_directives_severity_idx" ON "compliance_directives"("severity");

-- CreateIndex
CREATE INDEX "compliance_directives_isCorrupt_idx" ON "compliance_directives"("isCorrupt");

-- CreateIndex
CREATE INDEX "compliance_directives_publishedDate_idx" ON "compliance_directives"("publishedDate");

-- CreateIndex
CREATE INDEX "compliance_directives_effectiveDate_idx" ON "compliance_directives"("effectiveDate");

-- CreateIndex
CREATE INDEX "compliance_directives_deletedAt_idx" ON "compliance_directives"("deletedAt");

-- CreateIndex
CREATE INDEX "action_items_directiveId_idx" ON "action_items"("directiveId");

-- CreateIndex
CREATE INDEX "action_items_status_idx" ON "action_items"("status");

-- CreateIndex
CREATE INDEX "action_items_isFlagged_idx" ON "action_items"("isFlagged");

-- CreateIndex
CREATE INDEX "action_items_deletedAt_idx" ON "action_items"("deletedAt");

-- CreateIndex
CREATE INDEX "audit_logs_actionItemId_idx" ON "audit_logs"("actionItemId");

-- AddForeignKey
ALTER TABLE "compliance_directives" ADD CONSTRAINT "compliance_directives_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "regulatory_authorities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_directiveId_fkey" FOREIGN KEY ("directiveId") REFERENCES "compliance_directives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
