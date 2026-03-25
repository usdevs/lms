/*
  Warnings:

  - You are about to drop the column `recordKey` on the `audit_log` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "audit_log" DROP COLUMN "recordKey",
ADD COLUMN     "recordId" INTEGER;
