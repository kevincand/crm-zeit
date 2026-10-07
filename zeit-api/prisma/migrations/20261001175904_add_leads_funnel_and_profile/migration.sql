/*
  Warnings:

  - A unique constraint covering the columns `[document]` on the table `contacts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LeadOrigin" AS ENUM ('INSTAGRAM', 'WHATSAPP', 'OTHER');

-- CreateEnum
CREATE TYPE "OccupationalProfile" AS ENUM ('VETERINARIO', 'PRODUTOR_PECUARISTA', 'ZOOTECNISTA', 'TECNICO', 'OTHER');

-- CreateEnum
CREATE TYPE "FunnelStage" AS ENUM ('FIRST_CONTACT', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LossReason" AS ENUM ('PRICE', 'TIMING', 'COMPETITION', 'OTHER');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "document" TEXT,
ADD COLUMN     "funnelStage" "FunnelStage" NOT NULL DEFAULT 'FIRST_CONTACT',
ADD COLUMN     "lossReason" "LossReason",
ADD COLUMN     "origin" "LeadOrigin",
ADD COLUMN     "profile" "OccupationalProfile",
ADD COLUMN     "proposalNotes" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "contacts_document_key" ON "contacts"("document");
