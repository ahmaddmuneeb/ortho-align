-- AlterEnum (runs after initial_schema creates "UserRole")
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PATIENT';

-- AlterTable
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "patients_userId_key" ON "patients"("userId");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
