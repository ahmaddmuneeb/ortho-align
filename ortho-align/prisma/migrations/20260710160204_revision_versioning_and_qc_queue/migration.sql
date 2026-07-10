-- AlterTable
ALTER TABLE "case_production_urls" ADD COLUMN     "version" TEXT NOT NULL DEFAULT '1-1';

-- AlterTable
ALTER TABLE "case_workflow_logs" ADD COLUMN     "version" TEXT;
