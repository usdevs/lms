import { PrismaClient } from "@prisma/client";
import { CATALOGUE_MODELS } from "../src/lib/ai";
import { generateAndStoreItemEmbedding } from "../src/lib/embeddings";

const prisma = new PrismaClient();
const forceCaptions = process.argv.includes("--force-captions");

function getCaptionStrategyLabel(): string {
  if (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY) {
    return `Gemini semantic enrichment (${CATALOGUE_MODELS.gemini})`;
  }

  return "Gemini semantic enrichment is disabled (missing API key)";
}

async function main() {
  console.log("Fetching items from the database...");
  console.log(`Embedding model: ${CATALOGUE_MODELS.embedding}`);
  console.log(`Semantic image strategy: ${getCaptionStrategyLabel()}`);
  console.log(`Force caption reset: ${forceCaptions ? "enabled" : "disabled"}`);

  const items = await prisma.item.findMany({
    select: {
      itemId: true,
      itemDesc: true,
      itemImage: true,
      itemImageCaption: true,
    },
    orderBy: { itemId: "asc" },
  });
  console.log(`Found ${items.length} items. Starting embedding generation...`);

  for (const item of items) {
    console.log(`\nProcessing item ${item.itemId}: ${item.itemDesc}`);

    if (forceCaptions && item.itemImage && item.itemImageCaption) {
      await prisma.item.update({
        where: { itemId: item.itemId },
        data: { itemImageCaption: null },
      });
      console.log("  Existing caption cleared due to --force-captions");
    }

    await generateAndStoreItemEmbedding(item.itemId, forceCaptions);
    console.log("  Item indexing complete.");

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\nAll items processed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
