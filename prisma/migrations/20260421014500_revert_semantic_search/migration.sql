-- Remove semantic search and AI indexing columns from the item table.
ALTER TABLE "item"
DROP COLUMN IF EXISTS "item_image_caption",
DROP COLUMN IF EXISTS "item_needs_reindex",
DROP COLUMN IF EXISTS "item_reindex_requested_at",
DROP COLUMN IF EXISTS "item_last_indexed_at",
DROP COLUMN IF EXISTS "item_embedding";

-- Remove the pgvector extension after dropping dependent columns.
DROP EXTENSION IF EXISTS "vector";
