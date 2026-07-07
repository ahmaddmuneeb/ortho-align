-- CreateEnum
CREATE TYPE "ClarificationCategory" AS ENUM ('WRONG_FILES', 'MISSING_SCANS', 'DISTORTED_SCAN_DATA', 'MISMATCHED_PATIENT_DATA', 'MISSING_RECORDS', 'POOR_SCAN_QUALITY', 'OTHER_TECHNICAL_ISSUE');

-- AlterEnum
ALTER TYPE "CaseStatus" ADD VALUE 'CLARIFICATION_REQUESTED';

-- AlterTable
ALTER TABLE "case_files" ADD COLUMN     "version" TEXT NOT NULL DEFAULT '1-1';

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "caseNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "revisionNumber" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "case_clarifications" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "category" "ClarificationCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_clarifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_clarification_attachments" (
    "id" TEXT NOT NULL,
    "clarificationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_clarification_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "case_clarifications_caseId_idx" ON "case_clarifications"("caseId");

-- CreateIndex
CREATE INDEX "case_clarifications_createdAt_idx" ON "case_clarifications"("createdAt");

-- CreateIndex
CREATE INDEX "case_clarification_attachments_clarificationId_idx" ON "case_clarification_attachments"("clarificationId");

-- AddForeignKey
ALTER TABLE "case_clarifications" ADD CONSTRAINT "case_clarifications_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_clarifications" ADD CONSTRAINT "case_clarifications_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_clarification_attachments" ADD CONSTRAINT "case_clarification_attachments_clarificationId_fkey" FOREIGN KEY ("clarificationId") REFERENCES "case_clarifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
