-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetPasswordTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resetPasswordTokenHash" TEXT;
