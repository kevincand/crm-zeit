/*
  Warnings:

  - The `profile` column on the `contacts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "contacts" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "uf" SET DATA TYPE TEXT,
DROP COLUMN "profile",
ADD COLUMN     "profile" TEXT;
