import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { PaginatedItemsResponse } from "@/lib/utils/server/item";


export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "27");
    const skip = (page - 1) * limit;

    const items = await prisma.item.findMany({
      skip,
      take: limit,
      orderBy: { itemId: "desc" },
      select: {
        itemId: true,
        nuscSn: true,
        itemDesc: true,
        itemQty: true,
        itemUom: true,
        itemRemarks: true,
        itemPurchaseDate: true,
        itemRfpNumber: true,
        itemImage: true,
        itemSloc: true,
        itemIh: true,
        sloc: {
          select: {
            slocId: true,
            slocName: true,
          },
        },
        ih: {
          select: {
            ihId: true,
            ihName: true,
          },
        },
      },
    });

    const totalItems = await prisma.item.count();
    const totalPages = Math.ceil(totalItems / limit);

    const response: PaginatedItemsResponse = {
      items,
      totalPages,
      currentPage: page,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch paginated items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
};

