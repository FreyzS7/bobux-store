/*
  Warnings:

  - Added the required column `itemName` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "generatedScript" TEXT,
ADD COLUMN     "itemName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
