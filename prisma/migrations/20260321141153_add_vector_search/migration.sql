-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "item" ADD COLUMN     "item_embedding" vector(384);
