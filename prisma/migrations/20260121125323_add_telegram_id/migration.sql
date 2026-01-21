/*
  Warnings:

  - A unique constraint covering the columns `[telegram_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_telegram_handle_key";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "telegram_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_telegram_id_key" ON "user"("telegram_id");
