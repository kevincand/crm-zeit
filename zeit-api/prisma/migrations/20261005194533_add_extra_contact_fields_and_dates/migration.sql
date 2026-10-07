-- AlterEnum
ALTER TYPE "OccupationalProfile" ADD VALUE 'CONSULTOR';

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "city" TEXT,
ADD COLUMN     "lastContactAt" TIMESTAMP(3),
ADD COLUMN     "nextContactAt" TIMESTAMP(3),
ADD COLUMN     "sector" TEXT;
