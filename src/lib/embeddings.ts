import {
  buildItemSearchableText,
  captionImage,
  generateEmbedding,
  toPgVectorString,
} from "@/lib/ai";
import prisma from "@/lib/prisma";

export { captionImage, generateEmbedding } from "@/lib/ai";

export async function generateAndStoreItemEmbedding(
  itemId: number,
  recaptionImage = false,
): Promise<void> {
  try {
    const item = await prisma.item.findUnique({ where: { itemId } });
    if (!item) {
      return;
    }

    let caption = item.itemImageCaption ?? null;

    if (!item.itemImage && caption) {
      caption = null;
      await prisma.item.update({
        where: { itemId },
        data: { itemImageCaption: null },
      });
    } else if (item.itemImage && recaptionImage && caption) {
      caption = null;
      await prisma.item.update({
        where: { itemId },
        data: { itemImageCaption: null },
      });
    }

    if (item.itemImage && (recaptionImage || !caption)) {
      const newCaption = await captionImage(item.itemImage, {
        itemDesc: item.itemDesc,
        itemRemarks: item.itemRemarks,
        itemUom: item.itemUom,
        itemSloc: item.itemSloc,
      });
      if (newCaption) {
        caption = newCaption;
        await prisma.item.update({
          where: { itemId },
          data: { itemImageCaption: newCaption },
        });
      }
    }

    const searchableText = buildItemSearchableText({
      itemDesc: item.itemDesc,
      itemRemarks: item.itemRemarks,
      itemSloc: item.itemSloc,
      itemIh: item.itemIh,
      itemImageCaption: caption,
    });

    const embedding = await generateEmbedding(searchableText);
    if (embedding.length === 0) {
      return;
    }

    const vectorString = toPgVectorString(embedding);
    await prisma.$executeRaw`
      UPDATE item SET item_embedding = ${vectorString}::vector WHERE item_id = ${itemId}
    `;
    await prisma.item.update({
      where: { itemId },
      data: {
        itemImageCaption: caption,
        itemNeedsReindex: false,
        itemLastIndexedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Embedding generation failed for item ${itemId}:`, error);
  }
}
