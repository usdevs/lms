-- AlterTable
ALTER TABLE "ih" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ih_member" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "loan_item_detail" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "sloc" ADD COLUMN     "deleted_at" TIMESTAMP(3);
