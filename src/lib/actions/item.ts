"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import fs from "fs";
import path from "path";

import prisma from "@/lib/prisma";
import { formDataToObject } from "@/lib/utils";
import {
  DeleteItemSchema,
  EditItemServerSchema,
  NewItemServerSchema,
} from "@/lib/schema/item";
import { Prisma, LoanItemStatus } from "@prisma/client";
import { ItemPaginationParams, PaginatedItemsResponse } from "../types/items";

export async function createItem(formData: FormData) {
  let data;
  try {
    data = NewItemServerSchema.parse(formDataToObject(formData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      };
    }
    return {
      success: false,
      error: "Unknown error occurred. Please contact admin.",
    };
  }

  try {
    await prisma.item.create({
      data: {
        itemDesc: data.itemDesc.trim(),
        itemSloc: data.itemSloc.trim(),
        itemIh: data.itemIh.trim(),
        itemQty: data.itemQty,
        itemUom: data.itemUom.trim(),
        itemRemarks: data.itemRemarks?.trim() || null,
        itemPurchaseDate: data.itemPurchaseDate || null,
        itemRfpNumber: data.itemRfpNumber?.trim() || null,
        itemImage: data.itemImage?.trim() || null,
      },
    });
  } catch (error: any) {
    console.error("Error creating item:", error);

    // Handle Prisma-specific errors
    if (error.code === "P2002") {
      return {
        success: false,
        error: "An item with this ID already exists. Please use a different ID.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to create item. Please try again.",
    };
  }

  revalidatePath("/catalogue");
  return { success: true };
}

export async function updateItem(itemId: number, formData: FormData) {
  let data;
  try {
    data = EditItemServerSchema.parse(formDataToObject(formData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      };
    }
    return {
      success: false,
      error: "Unknown error occurred. Please contact admin.",
    };
  }
  
  const deleteImage = formData.get("deleteImage") === "true"; // Checks whether to delete   

  try {
    // Delete image if requested
    if (deleteImage && data.itemImage) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          data.itemImage.replace(/^\/+/, "")
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Deleted old image:", filePath);
        }
        data.itemImage = null; // Clear from database
      } catch (err) {
        console.error("Failed to delete old image:", err);
      }
    }

    await prisma.item.update({
      where: { itemId },
      data: {
        itemDesc: data.itemDesc.trim(),
        itemSloc: data.itemSloc.trim(),
        itemIh: data.itemIh.trim(),
        itemQty: data.itemQty,
        itemUom: data.itemUom.trim(),
        itemRemarks: data.itemRemarks?.trim() || null,
        itemPurchaseDate: data.itemPurchaseDate || null,
        itemRfpNumber: data.itemRfpNumber?.trim() || null,
        itemImage: data.itemImage?.trim() || null,
      },
    });
  } catch (error: any) {
    console.error("Error updating item:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        error: "Item not found. It may have been deleted.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to update item. Please try again.",
    };
  }

  revalidatePath("/catalogue");
  return { success: true };
}

export async function deleteItem(itemId: number) {
  let data;
  try {
    data = DeleteItemSchema.parse({ itemId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      };
    }
    return {
      success: false,
      error: "Unknown error occurred. Please contact admin.",
    };
  }

  try {
    // Check for active loans before deletion
    const activeLoans = await prisma.loanItemDetail.findFirst({
      where: {
        itemId: data.itemId,
        loanItemStatus: { in: [LoanItemStatus.PENDING, LoanItemStatus.ON_LOAN] }
      }
    });

    if (activeLoans) {
      return {
        success: false,
        error: "Cannot delete item with active or pending loans. Return or reject all loans first.",
      };
    }

    await prisma.item.delete({
      where: { itemId: data.itemId },
    });
  } catch (error: any) {
    console.error("Error deleting item:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        error: "Item not found. It may have already been deleted.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to delete item. Please try again.",
    };
  }

  revalidatePath("/catalogue");
  return { success: true };
}

export async function getItemsPaginated(params: ItemPaginationParams): Promise<PaginatedItemsResponse> {
  try {
    const skip = (params.page - 1) * params.limit;

    // Build where clause for filters with proper typing
    const conditions: Prisma.ItemWhereInput[] = [];

    if (params.search) {
      const searchConditions: Prisma.ItemWhereInput[] = [
        { itemDesc: { contains: params.search, mode: "insensitive" } },
        { itemRemarks: { contains: params.search, mode: "insensitive" } },
        { sloc: { slocName: { contains: params.search, mode: "insensitive" } } },
        { ih: { ihName: { contains: params.search, mode: "insensitive" } } },
      ];

      // Only search by itemId if the search string is a valid number
      const itemIdNumber = parseInt(params.search, 10);
      if (!isNaN(itemIdNumber) && itemIdNumber.toString() === params.search.trim()) {
        searchConditions.push({ itemId: { equals: itemIdNumber } });
      }

      conditions.push({
        OR: searchConditions,
      });
    }

    if (params.slocId) {
      conditions.push({ itemSloc: params.slocId });
    }

    if (params.ihId) {
      conditions.push({ itemIh: params.ihId });
    }

    // Build where clause
    const where: Prisma.ItemWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    // Build orderBy clause with proper typing
    const orderBy: Prisma.ItemOrderByWithRelationInput =
      params.sort === "name"
        ? { itemDesc: params.asc ? "asc" : "desc" }
        : params.sort === "quantity"
          ? { itemQty: params.asc ? "asc" : "desc" }
          : params.sort === "id"
            ? { itemId: params.asc ? "asc" : "desc" }
            : { itemId: "desc" };

    // Get filtered items with pagination
    const items = await prisma.item.findMany({
      where,
      skip,
      take: params.limit,
      orderBy,
      select: {
        itemId: true,
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
            ihType: true,
            members: {
              where: { isPrimary: true },
              select: {
                user: {
                  select: {
                    telegramHandle: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    // Get item IDs to fetch loan data
    const itemIds = items.map(item => item.itemId);

    // Calculate inventory stats for the fetched items
    const [pendingCounts, onLoanCounts] = await Promise.all([
      itemIds.length > 0
        ? prisma.loanItemDetail.groupBy({
            by: ['itemId'],
            where: {
              itemId: { in: itemIds },
              loanItemStatus: LoanItemStatus.PENDING,
            },
            _sum: { loanQty: true },
          })
        : [],
      itemIds.length > 0
        ? prisma.loanItemDetail.groupBy({
            by: ['itemId'],
            where: {
              itemId: { in: itemIds },
              loanItemStatus: LoanItemStatus.ON_LOAN,
            },
            _sum: { loanQty: true },
          })
        : [],
    ]);

    // Create maps for quick lookup
    const pendingMap = new Map(pendingCounts.map(p => [p.itemId, p._sum.loanQty || 0]));
    const onLoanMap = new Map(onLoanCounts.map(p => [p.itemId, p._sum.loanQty || 0]));

    // Enrich items with totalQty and netQty
    const enrichedItems = items.map(item => {
      const onLoan = onLoanMap.get(item.itemId) || 0;
      const pending = pendingMap.get(item.itemId) || 0;

      const totalQty = item.itemQty + onLoan;
      const netQty = Math.max(0, item.itemQty - pending);

      return {
        ...item,
        totalQty,
        netQty,
      };
    });

    // Count total items matching filters
    const totalItems = await prisma.item.count({ where });
    const totalPages = Math.ceil(totalItems / params.limit);

    return {
      data: enrichedItems,
      meta: {
        page: params.page,
        pageSize: params.limit,
        totalItems,
        totalPages,
      },
    };

  } catch (error) {
    console.error("Failed to fetch paginated items:", error);
    throw new Error("Failed to fetch items");
  }
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadItemImage(formData: FormData): Promise<{ url: string } | { error: string }> {
  try {
    const file = formData.get("photo") as File;

    if (!file) {
      return { error: "No file uploaded" };
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed." };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { error: "File too large. Maximum size is 10MB." };
    }

    const uploadsDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Sanitize filename - remove any path traversal characters and special chars
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(uploadsDir, uniqueName);
    
    // Double-check the resolved path is still within uploads directory
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return { error: "Invalid file path" };
    }

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

    const url = `/uploads/${uniqueName}`;
    return { url };
  } catch (error) {
    console.error("Failed to upload file:", error);
    return { error: "Failed to upload file" };
  }
}
