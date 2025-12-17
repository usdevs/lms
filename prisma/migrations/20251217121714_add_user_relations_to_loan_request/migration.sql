-- AlterTable
ALTER TABLE "loan_request" ADD COLUMN     "new_loggie_id" INTEGER,
ADD COLUMN     "new_req_id" INTEGER;

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_new_req_id_fkey" FOREIGN KEY ("new_req_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_new_loggie_id_fkey" FOREIGN KEY ("new_loggie_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
