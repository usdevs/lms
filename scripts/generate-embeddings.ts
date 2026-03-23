import { PrismaClient } from '@prisma/client';
import { pipeline } from '@xenova/transformers';

const prisma = new PrismaClient();

class EmbeddingPipeline {
  static task = "feature-extraction" as const;
  static model = "Xenova/all-MiniLM-L6-v2";
  static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model);
    }
    return this.instance;
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim() === "") return [];
  
  const extractor = await EmbeddingPipeline.getInstance();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

async function main() {
  console.log("Fetching items from the database...");
  const items = await prisma.item.findMany();
  
  console.log(`Found ${items.length} items. Starting AI vector generation...`);

  for (const item of items) {
    // Combine fields to give the AI rich context
    const searchableText = `${item.itemDesc} ${item.itemRemarks || ""} ${item.itemSloc} ${item.itemIh}`.trim();
    
    const embeddingVector = await generateEmbedding(searchableText);
    const vectorString = `[${embeddingVector.join(",")}]`;

    // updates the item with its embedded vector without dropping the column 
    await prisma.$executeRaw`
      UPDATE item 
      SET item_embedding = ${vectorString}::vector 
      WHERE item_id = ${item.itemId}
    `;
    
    console.log(`Successfully mapped and updated Item ID: ${item.itemId}`);
  }

  console.log("All existing items have been successfully embedded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });