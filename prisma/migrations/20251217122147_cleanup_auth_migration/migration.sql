/*
  Warnings:

  - You are about to drop the column `new_loggie_id` on the `loan_request` table. All the data in the column will be lost.
  - You are about to drop the column `new_req_id` on the `loan_request` table. All the data in the column will be lost.
  - You are about to drop the `loggies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `requester` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "loan_request" DROP CONSTRAINT "loan_request_loggie_id_fkey";

-- DropForeignKey
ALTER TABLE "loan_request" DROP CONSTRAINT "loan_request_new_loggie_id_fkey";

-- DropForeignKey
ALTER TABLE "loan_request" DROP CONSTRAINT "loan_request_new_req_id_fkey";

-- DropForeignKey
ALTER TABLE "loan_request" DROP CONSTRAINT "loan_request_req_id_fkey";

-- AlterTable
ALTER TABLE "loan_request" DROP COLUMN "new_loggie_id",
DROP COLUMN "new_req_id";

-- DropTable
DROP TABLE "loggies";

-- DropTable
DROP TABLE "requester";

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_req_id_fkey" FOREIGN KEY ("req_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_loggie_id_fkey" FOREIGN KEY ("loggie_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
