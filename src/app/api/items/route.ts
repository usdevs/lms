import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { PaginatedItemsResponse } from "@/lib/utils/server/item";
import type { Prisma } from "@prisma/client";

type SortOption = "name" | "quantity" | "id";

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "27", 10);
    const skip = (page - 1) * limit;

    // Get filter parameters with proper types
    const searchString = url.searchParams.get("search") || "";
    const filterSloc = url.searchParams.get("sloc") || "";
    const filterHolder = url.searchParams.get("ih") || "";
    const sortOptionParam = url.searchParams.get("sort") || "id";
    const sortOption: SortOption =
      sortOptionParam === "name" || sortOptionParam === "quantity"
        ? sortOptionParam
        : "id";
    const sortAsc = url.searchParams.get("asc") !== "false"; // Default to true

    // Build where clause for filters with proper typing
    const conditions: Prisma.ItemWhereInput[] = [];

    if (searchString) {
      conditions.push({
        OR: [
          { itemDesc: { contains: searchString, mode: "insensitive" } },
          { nuscSn: { contains: searchString, mode: "insensitive" } },
          { itemRemarks: { contains: searchString, mode: "insensitive" } },
          { sloc: { slocName: { contains: searchString, mode: "insensitive" } } },
          { ih: { ihName: { contains: searchString, mode: "insensitive" } } },
        ],
      });
    }

    if (filterSloc) {
      conditions.push({ itemSloc: filterSloc });
    }

    if (filterHolder) {
      conditions.push({ itemIh: filterHolder });
    }

    // Build where clause
    const where: Prisma.ItemWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    // Build orderBy clause with proper typing
    const orderBy: Prisma.ItemOrderByWithRelationInput =
      sortOption === "name"
        ? { itemDesc: sortAsc ? "asc" : "desc" }
        : sortOption === "quantity"
          ? { itemQty: sortAsc ? "asc" : "desc" }
          : { itemId: "desc" };

    // Get filtered items with pagination
    const items = await prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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

    // Count total items matching filters
    const totalItems = await prisma.item.count({ where });
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

