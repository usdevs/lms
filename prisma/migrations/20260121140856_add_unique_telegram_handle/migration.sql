/*
  Warnings:

  - A unique constraint covering the columns `[telegram_handle]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_telegram_handle_key" ON "user"("telegram_handle");
