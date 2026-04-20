import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAndStoreItemEmbedding } from "@/lib/embeddings";

export const maxDuration = 60;
const BATCH_SIZE = 10;

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pendingItems = await prisma.item.findMany({
    where: {
      itemNeedsReindex: true,
    },
    orderBy: [
      { itemReindexRequestedAt: "asc" },
      { itemId: "asc" },
    ],
    take: BATCH_SIZE,
    select: {
      itemId: true,
      itemImage: true,
      itemImageCaption: true,
    },
  });

  for (const item of pendingItems) {
    const recaptionImage = Boolean(item.itemImage);
    await generateAndStoreItemEmbedding(item.itemId, recaptionImage);
  }

  const remaining = await prisma.item.count({
    where: {
      itemNeedsReindex: true,
    },
  });

  return NextResponse.json({
    processed: pendingItems.length,
    remaining,
  });
}
