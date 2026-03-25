-- AlterTable
ALTER TABLE "item" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "loan_request" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "deleted_at" TIMESTAMP(3);
