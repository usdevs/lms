"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { formDataToObject } from "@/lib/utils";
import {
  DeleteItemSchema,
  EditItemServerSchema,
  NewItemServerSchema,
} from "@/lib/schema/item";
import { Prisma, LoanItemStatus } from "@prisma/client";
import { ItemPaginationParams, PaginatedItemsResponse } from "../types/items";
import { uploadImage, deleteImage } from "../storage";
import { getSession } from "@/lib/auth/session";
import { canManageItems } from "@/lib/auth/rbac";

/**
 * Helper to check if the current user has permission to manage items
 */
async function requireItemManageAuth(): Promise<{ authorized: true } | { authorized: false; error: string }> {
  const session = await getSession();
  if (!session) {
    return { authorized: false, error: "Authentication required" };
  }
  if (!canManageItems(session.user.role)) {
    return { authorized: false, error: "LOGS or ADMIN access required to manage items" };
  }
  return { authorized: true };
}

export async function createItem(formData: FormData) {
  // Check authorization
  const auth = await requireItemManageAuth();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

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
        itemUnloanable: data.itemUnloanable ?? false,
        itemExpendable: data.itemExpendable ?? false,
      },
    });
  } catch (error) {
    console.error("Error creating item:", error);

    // Handle Prisma-specific errors
    const prismaError = error as { code?: string; message?: string };
    if (prismaError.code === "P2002") {
      return {
        success: false,
        error: "An item with this ID already exists. Please use a different ID.",
      };
    }

    return {
      success: false,
      error: prismaError.message || "Failed to create item. Please try again.",
    };
  }

  revalidatePath("/catalogue");
  return { success: true };
}

export async function updateItem(itemId: number, formData: FormData) {
  // Check authorization
  const auth = await requireItemManageAuth();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

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
  
  const shouldDeleteImage = formData.get("deleteImage") === "true";
  const oldImageUrl = formData.get("oldImageUrl") as string | null;

  try {
    // Handle image deletion scenarios:
    // 1. User explicitly deleted image (shouldDeleteImage=true, no new image)
    // 2. User replaced image (shouldDeleteImage=true, new image uploaded - oldImageUrl contains the old one)
    if (shouldDeleteImage && oldImageUrl) {
      // Delete the OLD image from storage
      const result = await deleteImage(oldImageUrl);
      if (result.success) {
        console.log("Deleted old image:", oldImageUrl);
      } else {
        console.error("Failed to delete old image:", result.error);
      }
      
      // If no new image was uploaded, clear the itemImage field
      if (!data.itemImage) {
        data.itemImage = null;
      }
      // If a new image was uploaded, data.itemImage already contains the new URL
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
        itemUnloanable: data.itemUnloanable ?? false,
        itemExpendable: data.itemExpendable ?? false,
      },
    });
  } catch (error) {
    console.error("Error updating item:", error);

    const prismaError = error as { code?: string; message?: string };
    if (prismaError.code === "P2025") {
      return {
        success: false,
        error: "Item not found. It may have been deleted.",
      };
    }

    return {
      success: false,
      error: prismaError.message || "Failed to update item. Please try again.",
    };
  }

  revalidatePath("/catalogue");
  return { success: true };
}

export async function deleteItem(itemId: number) {
  // Check authorization
  const auth = await requireItemManageAuth();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

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

    // Get item to check for image before deleting
    const item = await prisma.item.findUnique({
      where: { itemId: data.itemId },
      select: { itemImage: true },
    });

    // Delete image from storage if exists
    if (item?.itemImage) {
      const result = await deleteImage(item.itemImage);
      if (!result.success) {
        console.error("Failed to delete item image:", result.error);
      }
    }

    await prisma.item.delete({
      where: { itemId: data.itemId },
    });
  } catch (error) {
    console.error("Error deleting item:", error);

    const prismaError = error as { code?: string; message?: string };
    if (prismaError.code === "P2025") {
      return {
        success: false,
        error: "Item not found. It may have already been deleted.",
      };
    }

    return {
      success: false,
      error: prismaError.message || "Failed to delete item. Please try again.",
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
        itemUnloanable: true,
        itemExpendable: true,
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

    // Calculate inventory stats for the fetched items (only ON_LOAN matters for totals)
    const onLoanCounts = itemIds.length > 0
      ? await prisma.loanItemDetail.groupBy({
          by: ['itemId'],
          where: {
            itemId: { in: itemIds },
            loanItemStatus: LoanItemStatus.ON_LOAN,
          },
          _sum: { loanQty: true },
        })
      : [];

    // Create map for quick lookup
    const onLoanMap = new Map(onLoanCounts.map(p => [p.itemId, p._sum.loanQty || 0]));

    // Enrich items with availableQty and totalQty
    // Normal items: itemQty is constant (total assets), availableQty = itemQty - onLoan
    // Expendable items: itemQty decreases on approval (consumed), availableQty = itemQty (remaining stock)
    const enrichedItems = items.map(item => {
      const onLoan = onLoanMap.get(item.itemId) || 0;

      if (item.itemExpendable) {
        // Expendable: itemQty is what's left, onLoan shows what's "out" but will be consumed
        // totalQty = itemQty + onLoan (original stock before consumption)
        // availableQty = itemQty (what can still be loaned)
        return {
          ...item,
          totalQty: item.itemQty + onLoan,
          availableQty: item.itemQty,
        };
      } else {
        // Normal: itemQty is constant total, onLoan tracks what's out
        // totalQty = itemQty (never changes)
        // availableQty = itemQty - onLoan
        return {
          ...item,
          totalQty: item.itemQty,
          availableQty: item.itemQty - onLoan,
        };
      }
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
  // Check authorization - only LOGS+ can upload item images
  const auth = await requireItemManageAuth();
  if (!auth.authorized) {
    return { error: auth.error };
  }

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

    // Upload using the storage utility (local or Supabase based on environment)
    return await uploadImage(file, 'item-images');
  } catch (error) {
    console.error("Failed to upload file:", error);
    return { error: "Failed to upload file" };
  }
}
