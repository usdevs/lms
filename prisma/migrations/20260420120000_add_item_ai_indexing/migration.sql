-- AlterTable
ALTER TABLE "item"
ADD COLUMN "item_image_caption" TEXT,
ADD COLUMN "item_needs_reindex" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "item_reindex_requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "item_last_indexed_at" TIMESTAMP(3);
